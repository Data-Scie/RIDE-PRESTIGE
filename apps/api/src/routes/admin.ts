import { Router, Request, Response, RequestHandler } from 'express';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db';
import { shapeRideFlowEvent } from '../lib/rideFlow';
import { ensureDriverDocuments, hasAllDriverDocuments } from '../lib/driverDocuments';
import { DEFAULT_CONTENT_PAGES } from '../data/cmsDefaults';
import { DEFAULT_WEBSITE_VEHICLES } from '../data/defaultWebsiteFleet';
import { isCloudinaryConfigured, uploadImageBuffer } from '../lib/cloudinary';
import {
  areVehicleDocumentsApproved,
  ensureVehicleDocuments,
  hasCurrentDocumentFile as hasCurrentVehicleDocumentFile,
  syncVehicleDocumentExpiries,
} from '../lib/vehicleDocuments';
import { pushNotification } from '../services/notificationService';
import type { UploadedFile } from '../lib/documentUpload';
import type { WebsiteVehicle, Promotion, FAQItem, NavigationItem, SupportTicket } from '../types';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
// multer's bundled types resolve a duplicate, hoisted copy of @types/express in this npm
// workspace, which TS treats as structurally incompatible with this file's express import —
// cast through unknown to bypass that tooling mismatch (not a real type error).
const uploadSingleImage = upload.single('image') as unknown as RequestHandler;

const router = Router();
router.use(authenticate, requireRole('admin', 'ops'));

const AFFILIATE_DOCUMENTS = [
  { type: 'operator_licence', label: 'Operator Licence' },
  { type: 'insurance', label: 'Insurance Document' },
  { type: 'company_cert', label: 'Company Certificate' },
  { type: 'proof_of_address', label: 'Proof of Address' },
];

async function ensureAffiliateDocuments(affiliateId: string) {
  await prisma.affiliateDocument.createMany({
    data: AFFILIATE_DOCUMENTS.map(document => ({
      id: `adoc-${uuid()}`,
      affiliateId,
      type: document.type,
      label: document.label,
    })),
    skipDuplicates: true,
  });
  return prisma.affiliateDocument.findMany({ where: { affiliateId }, orderBy: { label: 'asc' } });
}

function hasCurrentDocumentFile(document: { fileUrl: string | null; expiryDate: string | null }): boolean {
  return Boolean(document.fileUrl && /^https?:\/\//i.test(document.fileUrl)
    && document.expiryDate
    && new Date(`${document.expiryDate}T23:59:59.999Z`).getTime() >= Date.now());
}

function isOverrideApproval(req: Request): boolean {
  const bodyOverride = (req.body as { override?: unknown; approveAnyway?: unknown })?.override
    ?? (req.body as { approveAnyway?: unknown })?.approveAnyway;
  const queryOverride = req.query.override;
  return bodyOverride === true
    || bodyOverride === 'true'
    || bodyOverride === '1'
    || queryOverride === 'true'
    || queryOverride === '1';
}

// Helper to reshape a Booking row
function shapeBooking(b: {
  id: string; reference: string; status: string;
  createdAt: Date; updatedAt: Date;
  customerId: string | null; customerData: unknown; journeyData: unknown;
  vehicleCategory: string; vehicleId: string | null;
  estimatedMiles: number | null; estimatedFare: number | null;
  couponCode: string | null; discountAmount: number | null;
  adminNotes: string | null; jobId: string | null;
}) {
  return {
    id: b.id, reference: b.reference, status: b.status,
    createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString(),
    customerId: b.customerId,
    customer: b.customerData,
    journey: b.journeyData,
    vehicleCategory: b.vehicleCategory, vehicleId: b.vehicleId,
    estimatedMiles: b.estimatedMiles, estimatedFare: b.estimatedFare,
    couponCode: b.couponCode, discountAmount: b.discountAmount,
    adminNotes: b.adminNotes, jobId: b.jobId,
  };
}

function bookingStatusFromJob(jobStatus: string | undefined, fallback: string): string {
  // Only let the job's operational progress refine the displayed status while the booking
  // is still in its generic 'accepted' state — once an admin has explicitly set a terminal
  // status (rejected/cancelled/completed/etc.) that decision is authoritative and must not
  // be overwritten by a stale/unrelated job status on the next read.
  if (!jobStatus || fallback !== 'accepted') return fallback;
  if (['on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress'].includes(jobStatus)) return 'in_progress';
  if (['needs_allocation', 'driver_assigned', 'vehicle_assigned', 'driver_accepted'].includes(jobStatus)) return 'accepted';
  if (['completed', 'cancelled', 'rejected'].includes(jobStatus)) return jobStatus;
  return fallback;
}

function shapeJob(j: {
  id: string; bookingRef: string; bookingId: string | null; customerId: string | null;
  customerName: string; customerPhone: string; customerEmail: string | null;
  pickupAddress: string; dropoffAddress: string; stops: unknown;
  dateTime: Date; passengerCount: number; luggageCount: number;
  vehicleTypeRequested: string; vehicleCategory: string;
  fareAmount: number; commissionAmount: number; affiliatePayoutAmount: number; driverPayoutAmount: number;
  distance: string; estimatedDuration: string; specialInstructions: string | null;
  flightNumber: string | null; trainNumber: string | null;
  status: string; affiliateId: string | null; assignedDriverId: string | null; assignedVehicleId: string | null;
  completedAt: Date | null; customerRating: number | null; customerFeedback: string | null; driverRating: number | null;
  createdAt: Date; updatedAt: Date;
}) {
  return { ...j, dateTime: j.dateTime.toISOString(), completedAt: j.completedAt?.toISOString() ?? null, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString() };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Dashboard stats }
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [
      totalBookings, pendingBookings, completedJobs, activeJobs,
      totalCustomers, totalDrivers, approvedDrivers,
      totalAffiliates, approvedAffiliates,
      revenueAgg, monthRevenueAgg, commissionAgg, monthCommissionAgg,
      pendingTickets, websiteVehiclesCount, operationalVehiclesCount,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.job.count({ where: { status: 'completed' } }),
      prisma.job.count({ where: { status: { notIn: ['completed', 'cancelled', 'rejected'] } } }),
      prisma.customer.count(),
      prisma.driver.count(),
      prisma.driver.count({ where: { isApproved: true } }),
      prisma.affiliate.count(),
      prisma.affiliate.count({ where: { isApproved: true } }),
      prisma.job.aggregate({ _sum: { fareAmount: true }, where: { status: 'completed' } }),
      prisma.job.aggregate({ _sum: { fareAmount: true }, where: { status: 'completed', completedAt: { gte: monthStart } } }),
      prisma.job.aggregate({ _sum: { commissionAmount: true }, where: { status: 'completed' } }),
      prisma.job.aggregate({ _sum: { commissionAmount: true }, where: { status: 'completed', completedAt: { gte: monthStart } } }),
      prisma.supportTicket.count({ where: { status: 'open' } }),
      prisma.websiteVehicle.count(),
      prisma.fleetVehicle.count(),
    ]);
    res.json({
      success: true,
      data: {
        totalBookings, pendingBookings, completedJobs, activeJobs,
        totalCustomers, totalDrivers, approvedDrivers,
        totalAffiliates, approvedAffiliates,
        // totalRevenue = all customer fares from completed jobs (turnover)
        totalRevenue: parseFloat((revenueAgg._sum.fareAmount ?? 0).toFixed(2)),
        monthRevenue: parseFloat((monthRevenueAgg._sum.fareAmount ?? 0).toFixed(2)),
        // rpCommission = Ride Prestige's actual earned income (after paying out operators)
        totalRpCommission: parseFloat((commissionAgg._sum.commissionAmount ?? 0).toFixed(2)),
        monthRpCommission: parseFloat((monthCommissionAgg._sum.commissionAmount ?? 0).toFixed(2)),
        pendingTickets,
        fleetVehicles: websiteVehiclesCount,
        websiteFleetVehicles: websiteVehiclesCount,
        operationalFleetVehicles: operationalVehiclesCount,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Bookings ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: List all bookings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: number }
 *       - in: query
 *         name: limit
 *         schema: { type: number }
 *     responses:
 *       200: { description: Bookings list }
 */
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const p = parseInt(page); const l = parseInt(limit);
    const rows = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
    const jobIds = rows.map(row => row.jobId).filter((id): id is string => Boolean(id));
    const jobs = jobIds.length
      ? await prisma.job.findMany({
          where: { id: { in: jobIds } },
          select: { id: true, status: true, customerRating: true, customerFeedback: true, assignedDriverId: true, assignedVehicleId: true, affiliateId: true },
        })
      : [];
    const jobById = new Map(jobs.map(job => [job.id, job]));
    const driverIds = [...new Set(jobs.map(job => job.assignedDriverId).filter((id): id is string => Boolean(id)))];
    const affiliateIds = [...new Set(jobs.map(job => job.affiliateId).filter((id): id is string => Boolean(id)))];
    const vehicleIds = [...new Set(jobs.map(job => job.assignedVehicleId).filter((id): id is string => Boolean(id)))];
    const [acceptedDrivers, acceptedAffiliates, assignedVehicles] = await Promise.all([
      prisma.driver.findMany({ where: { id: { in: driverIds } }, select: { id: true, fullName: true, driverType: true } }),
      prisma.affiliate.findMany({ where: { id: { in: affiliateIds } }, select: { id: true, companyName: true, tradingName: true } }),
      prisma.fleetVehicle.findMany({ where: { id: { in: vehicleIds } }, select: { id: true, make: true, model: true, registration: true } }),
    ]);
    const driverById = new Map(acceptedDrivers.map(d => [d.id, d]));
    const affiliateById = new Map(acceptedAffiliates.map(a => [a.id, a]));
    const vehicleById = new Map(assignedVehicles.map(v => [v.id, v]));
    const shaped = rows.map(row => {
      const booking = shapeBooking(row);
      const linkedJob = row.jobId ? jobById.get(row.jobId) : undefined;
      const operationalStatus = linkedJob?.status;
      const assignedDriver = linkedJob?.assignedDriverId ? driverById.get(linkedJob.assignedDriverId) : undefined;
      const affiliate = linkedJob?.affiliateId ? affiliateById.get(linkedJob.affiliateId) : undefined;
      const assignedVehicle = linkedJob?.assignedVehicleId ? vehicleById.get(linkedJob.assignedVehicleId) : undefined;
      const acceptedBy: 'driver' | 'affiliate' | null = assignedDriver
        ? (assignedDriver.driverType === 'independentDriver' ? 'driver' : 'affiliate')
        : (affiliate ? 'affiliate' : null);
      return {
        ...booking,
        status: bookingStatusFromJob(operationalStatus, booking.status),
        operationalStatus: operationalStatus ?? null,
        customerRating: linkedJob?.customerRating ?? null,
        customerFeedback: linkedJob?.customerFeedback ?? null,
        assignedDriverId: linkedJob?.assignedDriverId ?? null,
        acceptedBy,
        affiliateName: affiliate?.companyName ?? affiliate?.tradingName ?? null,
        driverName: assignedDriver?.fullName ?? null,
        driverType: assignedDriver?.driverType ?? null,
        affiliateDriverName: assignedDriver && assignedDriver.driverType === 'affiliateDriver' ? assignedDriver.fullName : null,
        assignedVehicleId: linkedJob?.assignedVehicleId ?? null,
        vehicleLabel: assignedVehicle ? `${assignedVehicle.registration} - ${assignedVehicle.make} ${assignedVehicle.model}` : null,
      };
    });
    const filtered = status ? shaped.filter(row => row.status === status || row.operationalStatus === status) : shaped;
    const total = filtered.length;
    const data = filtered.slice((p - 1) * l, p * l);
    res.json({ success: true, data, total, page: p, limit: l, pages: Math.ceil(total / l) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   get:
 *     summary: Get a single booking
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking }
 *       404: { description: Not found }
 */
router.get('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const row = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!row) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    const b = shapeBooking(row);
    const linkedJob = b.jobId ? await prisma.job.findUnique({ where: { id: b.jobId } }) : null;
    const [assignedDriver, affiliate, flowEvents] = await Promise.all([
      linkedJob?.assignedDriverId ? prisma.driver.findUnique({ where: { id: linkedJob.assignedDriverId }, select: { fullName: true, driverType: true } }) : Promise.resolve(null),
      linkedJob?.affiliateId ? prisma.affiliate.findUnique({ where: { id: linkedJob.affiliateId }, select: { companyName: true } }) : Promise.resolve(null),
      linkedJob ? (prisma as any).rideFlowEvent.findMany({ where: { jobId: linkedJob.id }, orderBy: { createdAt: 'asc' } }) : Promise.resolve([]),
    ]);
    const acceptedBy: 'driver' | 'affiliate' | null = assignedDriver
      ? (assignedDriver.driverType === 'independentDriver' ? 'driver' : 'affiliate')
      : (affiliate ? 'affiliate' : null);
    res.json({
      success: true,
      data: {
        ...b,
        status: bookingStatusFromJob(linkedJob?.status, b.status),
        operationalStatus: linkedJob?.status ?? null,
        acceptedBy,
        affiliateName: affiliate?.companyName ?? null,
        affiliateDriverName: assignedDriver && assignedDriver.driverType === 'affiliateDriver' ? assignedDriver.fullName : null,
      },
      job: linkedJob ? shapeJob(linkedJob) : null,
      flowEvents: flowEvents.map(shapeRideFlowEvent),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   put:
 *     summary: Update booking status or admin notes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:     { type: string, enum: [pending, quoted, accepted, rejected, completed, cancelled] }
 *               adminNotes: { type: string }
 *     responses:
 *       200: { description: Updated booking }
 */
router.put('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });
    res.json({ success: true, data: shapeBooking(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   delete:
 *     summary: Cancel / delete a booking
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking cancelled }
 */
router.delete('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    await prisma.booking.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Uploads ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/uploads/vehicle-image:
 *   post:
 *     summary: Upload a vehicle image to Cloudinary
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Uploaded image URL }
 *       503: { description: Cloudinary not configured }
 */
router.post('/uploads/vehicle-image', uploadSingleImage, async (req: Request, res: Response) => {
  try {
    if (!isCloudinaryConfigured()) {
      res.status(503).json({ success: false, message: 'Image upload is not configured. Paste an image URL instead, or ask an admin to set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.' });
      return;
    }
    const file = (req as Request & { file?: UploadedFile }).file;
    if (!file) { res.status(400).json({ success: false, message: 'No image file provided' }); return; }
    if (!file.mimetype.startsWith('image/')) { res.status(400).json({ success: false, message: 'File must be an image' }); return; }
    const url = await uploadImageBuffer(file.buffer, 'ride-prestige/vehicles');
    res.json({ success: true, url });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

// ─── Website Fleet (CMS) ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/fleet:
 *   get:
 *     summary: List all CMS fleet vehicles
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Website fleet vehicles }
 */
router.get('/fleet', async (_req: Request, res: Response) => {
  try {
    const [vehicles, categories] = await Promise.all([
      prisma.websiteVehicle.findMany(),
      prisma.websiteFleetCategory.findMany(),
    ]);
    res.json({ success: true, data: vehicles, categories });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/fleet:
 *   post:
 *     summary: Add a new CMS fleet vehicle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categorySlug, name, description, passengers, features, imageUrl]
 *             properties:
 *               categorySlug: { type: string, enum: [prestige, minibus, coaches, taxi] }
 *               name:         { type: string }
 *               description:  { type: string }
 *               passengers:   { type: number }
 *               luggage:      { type: string }
 *               features:     { type: array, items: { type: string } }
 *               imageUrl:     { type: string }
 *               badge:        { type: string }
 *               available:    { type: boolean }
 *     responses:
 *       201: { description: Vehicle created }
 */
router.post('/fleet', async (req: Request, res: Response) => {
  try {
    const b = req.body as Omit<WebsiteVehicle, 'id'>;
    if (!b.name || !b.categorySlug || !b.description || !b.passengers) {
      res.status(400).json({ success: false, message: 'Missing required fields' }); return;
    }
    const v = await prisma.websiteVehicle.create({
      data: {
        id: `wv-${uuid()}`,
        categorySlug: b.categorySlug,
        name: b.name,
        description: b.description,
        passengers: Number(b.passengers),
        luggage: b.luggage ?? '',
        features: Array.isArray(b.features) ? b.features.slice(0, 12) : [],
        imageUrl: b.imageUrl?.startsWith('http') ? b.imageUrl : '',
        badge: b.badge || null,
        priceNote: b.priceNote || null,
        available: b.available !== false,
      },
    });
    res.status(201).json({ success: true, data: v });
  } catch (e: unknown) {
    res.status(500).json({ success: false, message: e instanceof Error ? e.message : 'Database error' });
  }
});

router.post('/fleet/restore-defaults', async (_req: Request, res: Response) => {
  try {
    const vehicles: Record<string, unknown>[] = [];
    for (const vehicle of DEFAULT_WEBSITE_VEHICLES) {
      vehicles.push(await prisma.websiteVehicle.upsert({
        where: { id: vehicle.id },
        update: {},
        create: vehicle,
      }));
    }
    res.json({ success: true, data: vehicles, total: vehicles.length });
  } catch (e: unknown) {
    res.status(500).json({ success: false, message: e instanceof Error ? e.message : 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/fleet/{id}:
 *   put:
 *     summary: Update a CMS fleet vehicle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated vehicle }
 */
router.put('/fleet/:id', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.websiteVehicle.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
    const b = req.body as Partial<WebsiteVehicle>;
    const data: Partial<WebsiteVehicle> = {};
    if (b.categorySlug !== undefined) data.categorySlug = b.categorySlug;
    if (b.name !== undefined) data.name = b.name;
    if (b.description !== undefined) data.description = b.description;
    if (b.passengers !== undefined) data.passengers = Number(b.passengers);
    if (b.luggage !== undefined) data.luggage = b.luggage;
    if (b.features !== undefined) data.features = Array.isArray(b.features) ? b.features.slice(0, 12) : [];
    if (b.imageUrl !== undefined) data.imageUrl = b.imageUrl?.startsWith('http') ? b.imageUrl : '';
    if (b.badge !== undefined) data.badge = b.badge || '';
    if (b.priceNote !== undefined) data.priceNote = b.priceNote || '';
    if (b.available !== undefined) data.available = b.available;
    const v = await prisma.websiteVehicle.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: v });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/fleet/{id}:
 *   delete:
 *     summary: Delete a CMS fleet vehicle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/fleet/:id', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.websiteVehicle.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
    await prisma.websiteVehicle.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Fleet Categories ─────────────────────────────────────────────────────────

router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id: _id, ...data } = req.body;
    const cat = await prisma.websiteFleetCategory.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: cat });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Drivers ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/drivers:
 *   get:
 *     summary: List all drivers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: approved
 *         schema: { type: string, enum: [true, false] }
 *     responses:
 *       200: { description: Drivers list }
 */
router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const { approved } = req.query as { approved?: string };
    const where = approved !== undefined ? { isApproved: approved === 'true' } : {};
    const drivers = await prisma.driver.findMany({
      where,
      include: { documents: true, affiliate: { select: { id: true, companyName: true } } },
      orderBy: { joinedDate: 'desc' },
    });
    const driversMissingDocuments = drivers.filter(driver => !hasAllDriverDocuments(driver.documents));
    if (driversMissingDocuments.length === 0) {
      const list = drivers.map(({ passwordHash: _, ...d }) => d);
      res.json({ success: true, data: list, total: list.length });
      return;
    }
    await Promise.all(driversMissingDocuments.map(driver => ensureDriverDocuments(driver.id)));
    const refreshed = await prisma.driver.findMany({
      where,
      include: { documents: true, affiliate: { select: { id: true, companyName: true } } },
      orderBy: { joinedDate: 'desc' },
    });
    const list = refreshed.map(({ passwordHash: _, ...d }) => d);
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/drivers:
 *   post:
 *     summary: Create a driver (manual admin onboarding)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Driver created }
 */
router.post('/drivers', async (req: Request, res: Response) => {
  try {
    const b = req.body as {
      fullName: string; email: string; phone: string; password: string;
      address?: string; city?: string; postcode?: string; dateOfBirth?: string;
      drivingLicenceNumber: string; privateHireBadgeNumber: string; nationalInsurance?: string;
      driverType: 'affiliateDriver' | 'independentDriver'; affiliateId?: string;
      preApprove?: boolean;
    };
    if (!b.fullName || !b.email || !b.phone || !b.password || !b.drivingLicenceNumber || !b.privateHireBadgeNumber || !b.driverType) {
      res.status(400).json({ success: false, message: 'Missing required driver fields' });
      return;
    }
    if (b.driverType === 'affiliateDriver' && !b.affiliateId) {
      res.status(400).json({ success: false, message: 'affiliateId is required for affiliate drivers' });
      return;
    }
    const drvId = `drv-${uuid()}`;
    const preApprove = Boolean(b.preApprove);
    const newDriver = await prisma.driver.create({
      data: {
        id: drvId,
        fullName: b.fullName, email: b.email, phone: b.phone,
        passwordHash: bcrypt.hashSync(b.password, 10),
        address: b.address ?? '', city: b.city ?? '', postcode: b.postcode ?? '',
        dateOfBirth: b.dateOfBirth ?? '', drivingLicenceNumber: b.drivingLicenceNumber,
        privateHireBadgeNumber: b.privateHireBadgeNumber, nationalInsurance: b.nationalInsurance,
        driverType: b.driverType,
        affiliateId: b.driverType === 'affiliateDriver' ? b.affiliateId : null,
        serviceAreas: b.driverType === 'independentDriver' && b.postcode
          ? [b.postcode.trim().toUpperCase().split(/\s+/)[0]]
          : [],
        status: 'offline',
        rating: 0, totalJobs: 0, totalEarnings: 0,
        documentsStatus: preApprove ? 'approved' : 'missing',
        isApproved: preApprove,
        applicationStatus: preApprove ? 'approved' : 'pending',
        documents: {
          create: [
            { id: uuid(), type: 'driving_licence',  label: 'Driving Licence',       status: preApprove ? 'approved' : 'missing' },
            { id: uuid(), type: 'phv_badge',        label: 'PHV Badge',             status: preApprove ? 'approved' : 'missing' },
            { id: uuid(), type: 'dbs_check',        label: 'DBS Check',             status: preApprove ? 'approved' : 'missing' },
            { id: uuid(), type: 'insurance',        label: 'Insurance Certificate', status: preApprove ? 'approved' : 'missing' },
          ],
        },
      },
      include: { documents: true, affiliate: { select: { id: true, companyName: true } } },
    });
    const { passwordHash: _, ...safe } = newDriver;
    res.status(201).json({ success: true, message: 'Driver created', data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/drivers/{id}:
 *   get:
 *     summary: Get a driver by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Driver }
 */
router.get('/drivers/:id', async (req: Request, res: Response) => {
  try {
    const d = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: { documents: true, affiliate: { select: { id: true, companyName: true } }, vehicles: true },
    });
    if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const { passwordHash: _, ...safe } = d;
    res.json({ success: true, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/drivers/{id}/approve:
 *   put:
 *     summary: Approve or reject a driver
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approve: { type: boolean }
 *     responses:
 *       200: { description: Driver approval updated }
 */
router.put('/drivers/:id/approve', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const { approve } = req.body as { approve: boolean };
    const override = isOverrideApproval(req);
    if (approve && override) {
      await ensureDriverDocuments(req.params.id);
      await prisma.driverDocument.updateMany({
        where: { driverId: req.params.id, status: { not: 'approved' } },
        data: { status: 'approved', rejectionReason: null },
      });
    }
    const d = await prisma.driver.update({
      where: { id: req.params.id },
      data: approve
        ? { isApproved: true, applicationStatus: 'approved', status: 'offline', documentsStatus: override ? 'approved' : exists.documentsStatus }
        : { isApproved: false, applicationStatus: 'rejected', status: 'offline' },
      include: { documents: true, affiliate: { select: { id: true, companyName: true } } },
    });
    const { passwordHash: _, ...safe } = d;
    res.json({ success: true, message: `Driver ${approve ? 'approved' : 'rejected'}`, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/drivers/{id}/reject:
 *   put:
 *     summary: Reject a pending driver application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Driver rejected }
 */
router.put('/drivers/:id/reject', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const d = await prisma.driver.update({
      where: { id: req.params.id },
      data: { isApproved: false, applicationStatus: 'rejected', status: 'offline' },
      include: { documents: true, affiliate: { select: { id: true, companyName: true } } },
    });
    const { passwordHash: _, ...safe } = d;
    res.json({ success: true, message: 'Driver rejected', data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/drivers/{id}/suspend:
 *   put:
 *     summary: Suspend an approved driver
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Driver suspended }
 */
router.put('/drivers/:id/suspend', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const d = await prisma.driver.update({
      where: { id: req.params.id },
      data: { isApproved: false, applicationStatus: 'suspended', status: 'offline' },
      include: { documents: true, affiliate: { select: { id: true, companyName: true } } },
    });
    const { passwordHash: _, ...safe } = d;
    res.json({ success: true, message: 'Driver suspended', data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/drivers/{id}/documents/{docId}:
 *   put:
 *     summary: Update a driver document status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:          { type: string, enum: [approved, pending, rejected, expired, missing] }
 *               rejectionReason: { type: string }
 *               expiryDate:      { type: string }
 *     responses:
 *       200: { description: Document updated }
 */
router.put('/drivers/:id/documents/:docId', async (req: Request, res: Response) => {
  try {
    const driverExists = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!driverExists) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const docExists = await prisma.driverDocument.findFirst({ where: { id: req.params.docId, driverId: req.params.id } });
    if (!docExists) { res.status(404).json({ success: false, message: 'Document not found' }); return; }

    const { status, rejectionReason, expiryDate } = req.body as { status?: string; rejectionReason?: string; expiryDate?: string };
    const override = isOverrideApproval(req);
    if (status === 'approved' && !override && !hasCurrentDocumentFile({ fileUrl: docExists.fileUrl, expiryDate: expiryDate ?? docExists.expiryDate })) {
      res.status(409).json({ success: false, message: 'A current uploaded document is required before approval' });
      return;
    }
    const doc = await prisma.driverDocument.update({
      where: { id: req.params.docId },
      data: {
        ...(status ? { status } : {}),
        ...(rejectionReason !== undefined ? { rejectionReason } : {}),
        ...(expiryDate !== undefined ? { expiryDate } : {}),
      },
    });

    // Recalculate documentsStatus
    const allDocs = await prisma.driverDocument.findMany({ where: { driverId: req.params.id } });
    const allApproved = allDocs.every(x => x.status === 'approved');
    const anyRejected = allDocs.some(x => x.status === 'rejected');
    const docStatus = allApproved ? 'approved' : anyRejected ? 'rejected' : 'pending';
    await prisma.driver.update({ where: { id: req.params.id }, data: { documentsStatus: docStatus } });

    res.json({ success: true, data: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Affiliates ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/affiliates:
 *   get:
 *     summary: List all affiliates
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Affiliates list }
 */
router.get('/affiliates', async (_req: Request, res: Response) => {
  try {
    const affiliates = await prisma.affiliate.findMany();
    const list = affiliates.map(({ passwordHash: _, ...a }) => a);
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/affiliates/{id}:
 *   get:
 *     summary: Get an affiliate with its drivers, vehicles, and documents
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Affiliate detail }
 *       404: { description: Not found }
 */
router.get('/affiliates/:id', async (req: Request, res: Response) => {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: req.params.id },
      include: {
        drivers: { include: { documents: true } },
        fleetVehicles: { include: { documents: true } },
      },
    });
    if (!affiliate) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
    const documents = await ensureAffiliateDocuments(affiliate.id);
    await Promise.all(affiliate.fleetVehicles.map(vehicle => syncVehicleDocumentExpiries(vehicle.id)));
    const fleetVehicles = await prisma.fleetVehicle.findMany({
      where: { affiliateId: affiliate.id },
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
    });
    const { passwordHash: _, drivers, fleetVehicles: _vehicles, ...safe } = affiliate;
    res.json({
      success: true,
      data: {
        ...safe,
        drivers: drivers.map(({ passwordHash: __, ...d }) => d),
        fleetVehicles,
        documents,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/affiliates/{id}/approve:
 *   put:
 *     summary: Approve or reject an affiliate
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approve: { type: boolean }
 *     responses:
 *       200: { description: Affiliate approval updated }
 */
router.put('/affiliates/:id/approve', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.affiliate.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
    const a = await prisma.affiliate.update({
      where: { id: req.params.id },
      data: { isApproved: req.body.approve },
    });
    const { passwordHash: _, ...safe } = a;
    res.json({ success: true, message: `Affiliate ${req.body.approve ? 'approved' : 'rejected'}`, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Customers ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/customers:
 *   get:
 *     summary: List all customers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Customers list }
 */
router.put('/affiliates/:affiliateId/documents/:documentId/approve', async (req: Request, res: Response) => {
  try {
    const document = await prisma.affiliateDocument.findFirst({
      where: { id: req.params.documentId, affiliateId: req.params.affiliateId },
    });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const override = isOverrideApproval(req);
    if (!override && !hasCurrentDocumentFile(document)) {
      res.status(409).json({ success: false, message: 'A current uploaded document is required before approval' });
      return;
    }
    const updated = await prisma.affiliateDocument.update({
      where: { id: document.id },
      data: { status: 'approved', rejectionReason: null },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/affiliates/:affiliateId/documents/:documentId/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body as { reason?: string };
    const document = await prisma.affiliateDocument.findFirst({
      where: { id: req.params.documentId, affiliateId: req.params.affiliateId },
    });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const updated = await prisma.affiliateDocument.update({
      where: { id: document.id },
      data: { status: 'rejected', rejectionReason: reason || 'Document was not approved' },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/vehicles/{id}/approve:
 *   put:
 *     summary: Approve a fleet vehicle, optionally overriding missing/expired documents
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vehicle approved }
 */
router.put('/vehicles/:id/approve', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.fleetVehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }
    const override = isOverrideApproval(req);
    const complianceDates = [vehicle.motExpiry, vehicle.insuranceExpiry, vehicle.phvLicenceExpiry];
    if (!override && complianceDates.some(value => {
      const timestamp = new Date(`${value}T23:59:59.999Z`).getTime();
      return Number.isNaN(timestamp) || timestamp < Date.now();
    })) {
      res.status(409).json({ success: false, message: 'Expired vehicle compliance cannot be approved' });
      return;
    }
    const documents = await ensureVehicleDocuments(vehicle.id);
    if (!override && !areVehicleDocumentsApproved(documents)) {
      res.status(409).json({ success: false, message: 'Approve all uploaded current vehicle documents before approving this vehicle' });
      return;
    }
    if (override) {
      await prisma.vehicleDocument.updateMany({
        where: { vehicleId: vehicle.id, status: { not: 'approved' } },
        data: { status: 'approved', rejectionReason: null },
      });
    }
    const updated = await prisma.fleetVehicle.update({
      where: { id: vehicle.id },
      data: { isApproved: true, approvalStatus: 'approved', rejectionReason: null, status: 'available' },
    });
    if (updated.ownerDriverId) {
      await pushNotification(updated.ownerDriverId, 'driver', 'Vehicle Approved', `${updated.make} ${updated.model} (${updated.registration}) is approved for direct rides.`, 'document');
    }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/vehicles/:vehicleId/documents/:documentId/approve', async (req: Request, res: Response) => {
  try {
    const document = await prisma.vehicleDocument.findFirst({
      where: { id: req.params.documentId, vehicleId: req.params.vehicleId },
    });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const override = isOverrideApproval(req);
    if (!override && !hasCurrentVehicleDocumentFile(document)) {
      res.status(409).json({ success: false, message: 'A current uploaded document is required before approval' });
      return;
    }
    const updated = await prisma.vehicleDocument.update({
      where: { id: document.id },
      data: { status: 'approved', rejectionReason: null },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/vehicles/:vehicleId/documents/:documentId/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body as { reason?: string };
    const document = await prisma.vehicleDocument.findFirst({
      where: { id: req.params.documentId, vehicleId: req.params.vehicleId },
    });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const updated = await prisma.vehicleDocument.update({
      where: { id: document.id },
      data: { status: 'rejected', rejectionReason: reason || 'Document was not approved' },
    });
    await prisma.fleetVehicle.update({
      where: { id: req.params.vehicleId },
      data: { isApproved: false, approvalStatus: 'rejected', status: 'offline', rejectionReason: updated.rejectionReason },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.get('/customers', async (_req: Request, res: Response) => {
  try {
    const [customers, jobs] = await Promise.all([
      prisma.customer.findMany(),
      prisma.job.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);
    const affiliateIds = [...new Set(jobs.map(job => job.affiliateId).filter((id): id is string => Boolean(id)))];
    const driverIds = [...new Set(jobs.map(job => job.assignedDriverId).filter((id): id is string => Boolean(id)))];
    const [affiliates, drivers] = await Promise.all([
      prisma.affiliate.findMany({ where: { id: { in: affiliateIds } }, select: { id: true, companyName: true, tradingName: true } }),
      prisma.driver.findMany({ where: { id: { in: driverIds } }, select: { id: true, fullName: true, driverType: true } }),
    ]);
    const affiliateById = new Map(affiliates.map(affiliate => [affiliate.id, affiliate]));
    const driverById = new Map(drivers.map(driver => [driver.id, driver]));
    const customerByEmail = new Map(customers.map(customer => [customer.email.toLowerCase(), customer]));
    const jobGroups = new Map<string, typeof jobs>();
    for (const job of jobs) {
      const key = job.customerEmail?.toLowerCase() || `phone:${job.customerPhone}`;
      jobGroups.set(key, [...(jobGroups.get(key) ?? []), job]);
    }

    const list: Record<string, unknown>[] = Array.from(jobGroups.entries()).map(([key, customerJobs]) => {
      const latest = customerJobs[0];
      const registered = latest.customerEmail ? customerByEmail.get(latest.customerEmail.toLowerCase()) : undefined;
      const ratings = customerJobs.map(job => job.driverRating).filter((rating): rating is number => rating !== null);
      const affiliate = latest.affiliateId ? affiliateById.get(latest.affiliateId) : null;
      const driver = latest.assignedDriverId ? driverById.get(latest.assignedDriverId) : null;
      const acceptedBy = affiliate
        ? 'affiliate'
        : driver
          ? 'independent_driver'
          : 'unassigned';
      return {
        id: registered?.id ?? `guest:${encodeURIComponent(key)}`,
        fullName: registered?.fullName ?? latest.customerName,
        email: registered?.email ?? latest.customerEmail ?? '',
        phone: registered?.phone ?? latest.customerPhone,
        createdAt: registered?.createdAt.toISOString() ?? customerJobs[customerJobs.length - 1].createdAt.toISOString(),
        isGuest: !registered,
        totalJobs: customerJobs.length,
        totalSpend: parseFloat(customerJobs.reduce((sum, job) => sum + job.fareAmount, 0).toFixed(2)),
        averageCustomerRating: ratings.length
          ? parseFloat((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1))
          : null,
        latestRide: {
          bookingRef: latest.bookingRef,
          status: latest.status,
          dateTime: latest.dateTime.toISOString(),
          acceptedBy,
          affiliateId: latest.affiliateId,
          affiliateName: affiliate?.companyName ?? affiliate?.tradingName ?? null,
          driverId: latest.assignedDriverId,
          driverName: driver?.fullName ?? null,
          driverType: driver?.driverType ?? null,
          pickupAddress: latest.pickupAddress,
          dropoffAddress: latest.dropoffAddress,
          vehicleCategory: latest.vehicleCategory,
          fareAmount: latest.fareAmount,
        },
      };
    });

    for (const customer of customers) {
      if (!jobGroups.has(customer.email.toLowerCase())) {
        const { passwordHash: _, ...safe } = customer;
        list.push({
          ...safe,
          createdAt: customer.createdAt.toISOString(),
          isGuest: false,
          totalJobs: 0,
          totalSpend: 0,
          averageCustomerRating: null,
          latestRide: null,
        });
      }
    }
    const sortDate = (row: Record<string, unknown>) => {
      const latestRide = row.latestRide as { dateTime?: string } | null | undefined;
      return new Date(latestRide?.dateTime ?? String(row.createdAt)).getTime();
    };
    list.sort((a, b) => sortDate(b) - sortDate(a));
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Support Tickets ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/support:
 *   get:
 *     summary: List all support tickets
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, in_progress, resolved] }
 *     responses:
 *       200: { description: Tickets }
 */
router.get('/support', async (req: Request, res: Response) => {
  try {
    const { status } = req.query as { status?: string };
    const where = status ? { status } : {};
    const tickets = await prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' } });
    const list = tickets.map(t => ({
      ...t,
      customer: t.customerData,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/support/{id}:
 *   put:
 *     summary: Update a support ticket
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:     { type: string, enum: [open, in_progress, resolved] }
 *               adminNotes: { type: string }
 *               reply:      { type: string }
 *     responses:
 *       200: { description: Ticket updated }
 */
router.put('/support/:id', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Ticket not found' }); return; }
    const { status, adminNotes, reply } = req.body as { status?: SupportTicket['status']; adminNotes?: string; reply?: string };
    const t = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(reply !== undefined ? { reply } : {}),
      },
    });
    res.json({ success: true, data: { ...t, customer: t.customerData, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Pricing ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/pricing:
 *   get:
 *     summary: Get pricing configuration
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Pricing config }
 */
router.get('/pricing', async (_req: Request, res: Response) => {
  try {
    const p = await prisma.pricingConfig.findUnique({ where: { id: 'default' } });
    if (!p) { res.status(404).json({ success: false, message: 'Pricing config not found' }); return; }
    const shaped = {
      prestige: { ratePerMile: p.prestigeRatePerMile, hourlyRate: p.prestigeHourlyRate },
      minibus:  { ratePerMile: p.minibusRatePerMile, rate16Seater: p.minibusRate16Seater, rate24Seater: p.minibusRate24Seater, rate32Seater: p.minibusRate32Seater },
      coaches:  { ratePerMile: p.coachesRatePerMile, hourlyRate: p.coachesHourlyRate },
      taxi:     { ratePerMile: p.taxiRatePerMile, minimumFare: p.taxiMinimumFare },
      driverSearchRadiusMiles: p.driverSearchRadiusMiles,
      commissionPercentage: p.commissionPercentage,
    };
    res.json({ success: true, data: shaped });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/pricing:
 *   put:
 *     summary: Update pricing configuration
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Updated pricing }
 */
router.put('/pricing', async (req: Request, res: Response) => {
  try {
    const b = req.body as {
      prestige?: { ratePerMile?: number; hourlyRate?: number };
      minibus?: { ratePerMile?: number; rate16Seater?: number; rate24Seater?: number; rate32Seater?: number };
      coaches?: { ratePerMile?: number; hourlyRate?: number };
      taxi?: { ratePerMile?: number; minimumFare?: number };
      driverSearchRadiusMiles?: number;
      commissionPercentage?: number;
    };
    const data: Record<string, number> = {};
    if (b.prestige?.ratePerMile !== undefined) data.prestigeRatePerMile = b.prestige.ratePerMile;
    if (b.prestige?.hourlyRate !== undefined) data.prestigeHourlyRate = b.prestige.hourlyRate;
    if (b.minibus?.ratePerMile !== undefined) data.minibusRatePerMile = b.minibus.ratePerMile;
    if (b.minibus?.rate16Seater !== undefined) data.minibusRate16Seater = b.minibus.rate16Seater;
    if (b.minibus?.rate24Seater !== undefined) data.minibusRate24Seater = b.minibus.rate24Seater;
    if (b.minibus?.rate32Seater !== undefined) data.minibusRate32Seater = b.minibus.rate32Seater;
    if (b.coaches?.ratePerMile !== undefined) data.coachesRatePerMile = b.coaches.ratePerMile;
    if (b.coaches?.hourlyRate !== undefined) data.coachesHourlyRate = b.coaches.hourlyRate;
    if (b.taxi?.ratePerMile !== undefined) data.taxiRatePerMile = b.taxi.ratePerMile;
    if (b.taxi?.minimumFare !== undefined) data.taxiMinimumFare = b.taxi.minimumFare;
    if (b.driverSearchRadiusMiles !== undefined) data.driverSearchRadiusMiles = b.driverSearchRadiusMiles;
    if (b.commissionPercentage !== undefined) data.commissionPercentage = b.commissionPercentage;
    const p = await prisma.pricingConfig.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', prestigeRatePerMile: 4.40, prestigeHourlyRate: 70, minibusRatePerMile: 4.00, minibusRate16Seater: 420, minibusRate24Seater: 520, minibusRate32Seater: 620, coachesRatePerMile: 4.00, coachesHourlyRate: 110, taxiRatePerMile: 3.00, taxiMinimumFare: 8, driverSearchRadiusMiles: 20, commissionPercentage: 15, driverPayoutPercentage: 100, ...data },
    });
    const shaped = {
      prestige: { ratePerMile: p.prestigeRatePerMile, hourlyRate: p.prestigeHourlyRate },
      minibus:  { ratePerMile: p.minibusRatePerMile, rate16Seater: p.minibusRate16Seater, rate24Seater: p.minibusRate24Seater, rate32Seater: p.minibusRate32Seater },
      coaches:  { ratePerMile: p.coachesRatePerMile, hourlyRate: p.coachesHourlyRate },
      taxi:     { ratePerMile: p.taxiRatePerMile, minimumFare: p.taxiMinimumFare },
      driverSearchRadiusMiles: p.driverSearchRadiusMiles,
      commissionPercentage: p.commissionPercentage,
    };
    res.json({ success: true, data: shaped });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Site Settings ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get site settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Site settings }
 */
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (!s) { res.status(404).json({ success: false, message: 'Settings not found' }); return; }
    res.json({ success: true, data: s });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update site settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Updated settings }
 */
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const { id: _id, ...data } = req.body;
    const s = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });
    res.json({ success: true, data: s });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Promotions ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/promotions:
 *   get:
 *     summary: List all promotions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Promotions }
 */
router.get('/promotions', async (_req: Request, res: Response) => {
  try {
    const promotions = await prisma.promotion.findMany();
    res.json({ success: true, data: promotions });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/promotions:
 *   post:
 *     summary: Create a promotion
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, discountType, discountValue, startDate, endDate, terms]
 *             properties:
 *               title:         { type: string }
 *               description:   { type: string }
 *               couponCode:    { type: string }
 *               discountType:  { type: string, enum: [percentage, fixed] }
 *               discountValue: { type: number }
 *               startDate:     { type: string }
 *               endDate:       { type: string }
 *               active:        { type: boolean }
 *               terms:         { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/promotions', async (req: Request, res: Response) => {
  try {
    const { active: rawActive, ...rest } = req.body as Omit<Promotion, 'id'>;
    const p = await prisma.promotion.create({
      data: { ...rest, id: `promo-${uuid()}`, active: rawActive !== false },
    });
    res.status(201).json({ success: true, data: p });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/promotions/{id}:
 *   put:
 *     summary: Update a promotion
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/promotions/:id', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.promotion.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Promotion not found' }); return; }
    const { id: _id, ...data } = req.body;
    const p = await prisma.promotion.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: p });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/promotions/{id}:
 *   delete:
 *     summary: Delete a promotion
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/promotions/:id', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.promotion.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    await prisma.promotion.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Promotion deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── FAQs ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/faqs:
 *   get:
 *     summary: List all FAQs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: FAQs }
 */
router.get('/faqs', async (_req: Request, res: Response) => {
  try {
    const faqs = await prisma.fAQItem.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, data: faqs });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/faqs:
 *   post:
 *     summary: Create a FAQ
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer, category]
 *             properties:
 *               question: { type: string }
 *               answer:   { type: string }
 *               category: { type: string }
 *               order:    { type: number }
 *               active:   { type: boolean }
 *     responses:
 *       201: { description: Created }
 */
router.post('/faqs', async (req: Request, res: Response) => {
  try {
    const { active: rawActive, order: rawOrder, ...rest } = req.body as Omit<FAQItem, 'id'>;
    const count = await prisma.fAQItem.count();
    const f = await prisma.fAQItem.create({
      data: { ...rest, id: `faq-${uuid()}`, active: rawActive !== false, order: rawOrder ?? (count + 1) },
    });
    res.status(201).json({ success: true, data: f });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/faqs/{id}:
 *   put:
 *     summary: Update a FAQ
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/faqs/:id', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.fAQItem.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'FAQ not found' }); return; }
    const { id: _id, ...data } = req.body;
    const f = await prisma.fAQItem.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: f });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/faqs/{id}:
 *   delete:
 *     summary: Delete a FAQ
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/faqs/:id', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.fAQItem.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    await prisma.fAQItem.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Navigation ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/navigation:
 *   get:
 *     summary: List navigation items
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Navigation items }
 */
router.get('/navigation', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.navigationItem.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/admin/navigation:
 *   put:
 *     summary: Replace entire navigation array
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:      { type: string }
 *                     label:   { type: string }
 *                     href:    { type: string }
 *                     visible: { type: boolean }
 *                     order:   { type: number }
 *     responses:
 *       200: { description: Updated navigation }
 */
router.put('/navigation', async (req: Request, res: Response) => {
  try {
    const { items } = req.body as { items: NavigationItem[] };
    if (!Array.isArray(items)) { res.status(400).json({ success: false, message: 'items array required' }); return; }
    // Replace all navigation items
    await prisma.navigationItem.deleteMany({});
    const created = await Promise.all(
      items.map(i => prisma.navigationItem.create({ data: i })),
    );
    res.json({ success: true, data: created });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Get admin notifications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Notifications }
 */
// ─── Cancellation / Refund Policy ────────────────────────────────────────────

router.get('/refund', async (_req: Request, res: Response) => {
  try {
    const policy = await prisma.cancellationPolicy.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
    res.json({ success: true, data: policy });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/refund', async (req: Request, res: Response) => {
  try {
    const { minHoursBeforeRide, refundWindowHours, message } = req.body;
    const policy = await prisma.cancellationPolicy.upsert({
      where: { id: 'default' },
      create: { id: 'default', minHoursBeforeRide, refundWindowHours, message },
      update: { minHoursBeforeRide, refundWindowHours, message },
    });
    res.json({ success: true, data: policy });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Website Pages (CMS) ──────────────────────────────────────────────────────

const DEFAULT_PAGES = [
  {
    id: 'page-home', slug: 'home', title: 'Homepage',
    seoTitle: 'Ride Prestige — Coach & Minibus Hire UK',
    metaDescription: 'Coach and minibus hire across Sheffield and the UK. Reliable transport for groups, events and airport transfers.',
    ogTitle: 'Ride Prestige', ogDescription: 'Your local transport minutes away.',
    sectionsJson: [
      {
        id: 'home-hero',
        type: 'hero',
        visible: true,
        order: 1,
        content: {
          eyebrow: 'Sheffield & South Yorkshire',
          title: 'Coach and minibus hire',
          highlightedTitle: 'for every group journey.',
          description: 'Dependable coach and minibus transport across Sheffield and the UK. Professional drivers, seamless airport transfers, corporate travel and event logistics.',
          primaryCtaLabel: 'Book Now',
          secondaryCtaLabel: 'View our fleet',
          stat1Value: '10K+',
          stat1Label: 'Journeys',
          stat2Value: '4.9★',
          stat2Label: 'Rating',
          stat3Value: '24/7',
          stat3Label: 'Service',
          stat4Value: '50+',
          stat4Label: 'Drivers',
        },
      },
      {
        id: 'home-fleet',
        type: 'fleet_strip',
        visible: true,
        order: 2,
        content: {
          eyebrow: 'Our fleet',
          title: 'Choose your vehicle',
          description: 'Four premium hire options, one booking platform. Whatever the journey, we have the right vehicle.',
        },
      },
      {
        id: 'home-promo',
        type: 'promo_banner',
        visible: true,
        order: 3,
        content: { label: 'Limited Offer' },
      },
    ],
  },
  ...DEFAULT_CONTENT_PAGES,
];

router.get('/pages', async (_req: Request, res: Response) => {
  try {
    await prisma.websitePage.createMany({ data: DEFAULT_PAGES, skipDuplicates: true });
    let pages = await prisma.websitePage.findMany({ orderBy: { slug: 'asc' } });

    // Merge any newly-added default fields into the stored hero section
    // (so adding new CMS fields doesn't require a manual DB reset)
    const home = pages.find(page => page.slug === 'home');
    if (home) {
      const stored = Array.isArray(home.sectionsJson) ? home.sectionsJson as Record<string, unknown>[] : [];
      const defaultHero = (DEFAULT_PAGES[0].sectionsJson as Record<string, unknown>[]).find((s: Record<string, unknown>) => s.id === 'home-hero');
      const storedHero = stored.find((s: Record<string, unknown>) => s.id === 'home-hero');
      if (defaultHero && storedHero) {
        const defaultContent = defaultHero.content as Record<string, unknown>;
        const storedContent = storedHero.content as Record<string, unknown>;
        const merged = { ...defaultContent, ...storedContent };
        const hasNew = Object.keys(defaultContent).some(k => !(k in storedContent));
        if (hasNew || stored.length === 0) {
          const updatedSections = stored.length === 0
            ? DEFAULT_PAGES[0].sectionsJson
            : stored.map((s: Record<string, unknown>) => s.id === 'home-hero' ? { ...s, content: merged } : s);
          await prisma.websitePage.update({
            where: { id: home.id },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: { sectionsJson: updatedSections as any },
          });
          pages = await prisma.websitePage.findMany({ orderBy: { slug: 'asc' } });
        }
      }
    }

    const shaped = pages.map(p => ({ ...p, sections: p.sectionsJson }));
    res.json({ success: true, data: shaped });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/pages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, seoTitle, metaDescription, ogTitle, ogDescription, sections } = req.body;
    const page = await prisma.websitePage.update({
      where: { id },
      data: { title, seoTitle, metaDescription, ogTitle, ogDescription, sectionsJson: sections ?? [] },
    });
    res.json({ success: true, data: { ...page, sections: page.sectionsJson } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Vacancies ────────────────────────────────────────────────────────────────

router.get('/vacancies', async (_req: Request, res: Response) => {
  try {
    const list = await prisma.vacancy.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: list });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

router.post('/vacancies', async (req: Request, res: Response) => {
  try {
    const { title, department, location, type, description, requirements, salary, active } = req.body;
    const v = await prisma.vacancy.create({ data: { title, department, location, type: type ?? 'full-time', description, requirements, salary, active: active ?? true } });
    res.status(201).json({ success: true, data: v });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

router.put('/vacancies/:id', async (req: Request, res: Response) => {
  try {
    const { id: _id, createdAt: _ca, ...data } = req.body;
    const v = await prisma.vacancy.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: v });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

router.delete('/vacancies/:id', async (req: Request, res: Response) => {
  try {
    await prisma.vacancy.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Vacancy deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

// ─── Courses ──────────────────────────────────────────────────────────────────

router.get('/courses', async (_req: Request, res: Response) => {
  try {
    const list = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: list });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

router.post('/courses', async (req: Request, res: Response) => {
  try {
    const { title, description, duration, price, imageUrl, active } = req.body;
    const c = await prisma.course.create({ data: { title, description, duration, price: price ?? null, imageUrl: imageUrl ?? null, active: active ?? true } });
    res.status(201).json({ success: true, data: c });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

router.put('/courses/:id', async (req: Request, res: Response) => {
  try {
    const { id: _id, createdAt: _ca, ...data } = req.body;
    const c = await prisma.course.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: c });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

router.delete('/courses/:id', async (req: Request, res: Response) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Course deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

// ─── Attributes ───────────────────────────────────────────────────────────────

router.get('/attributes', async (_req: Request, res: Response) => {
  try {
    const list = await prisma.attribute.findMany({ orderBy: { label: 'asc' } });
    res.json({ success: true, data: list });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

router.post('/attributes', async (req: Request, res: Response) => {
  try {
    const { key, label, type, options, category, active } = req.body;
    const a = await prisma.attribute.create({ data: { key, label, type: type ?? 'text', options: options ?? [], category: category ?? 'vehicle', active: active ?? true } });
    res.status(201).json({ success: true, data: a });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

router.put('/attributes/:id', async (req: Request, res: Response) => {
  try {
    const { id: _id, ...data } = req.body;
    const a = await prisma.attribute.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: a });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

router.delete('/attributes/:id', async (req: Request, res: Response) => {
  try {
    await prisma.attribute.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Attribute deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Database error' }); }
});

// ─── Notifications ────────────────────────────────────────────────────────────

router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const adminId = req.user!.id;
    const list = await prisma.notification.findMany({
      where: { recipientId: adminId },
      orderBy: { createdAt: 'desc' },
    });
    const shaped = list.map(n => ({ ...n, createdAt: n.createdAt.toISOString() }));
    res.json({ success: true, data: shaped, unread: shaped.filter(n => !n.isRead).length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

export default router;
