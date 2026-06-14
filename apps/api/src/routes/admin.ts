import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db';
import type { WebsiteVehicle, Promotion, FAQItem, NavigationItem, SupportTicket } from '../types';

const router = Router();
router.use(authenticate, requireRole('admin', 'ops'));

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
  if (!jobStatus) return fallback;
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
    const [
      totalBookings, pendingBookings, completedJobs, activeJobs,
      totalCustomers, totalDrivers, approvedDrivers,
      totalAffiliates, approvedAffiliates,
      earningsAgg, pendingTickets, fleetVehiclesCount,
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
      prisma.earningEntry.aggregate({ _sum: { grossAmount: true } }),
      prisma.supportTicket.count({ where: { status: 'open' } }),
      prisma.fleetVehicle.count(),
    ]);
    res.json({
      success: true,
      data: {
        totalBookings, pendingBookings, completedJobs, activeJobs,
        totalCustomers, totalDrivers, approvedDrivers,
        totalAffiliates, approvedAffiliates,
        totalRevenue: parseFloat((earningsAgg._sum.grossAmount ?? 0).toFixed(2)),
        pendingTickets, fleetVehicles: fleetVehiclesCount,
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
          select: { id: true, status: true, customerRating: true, customerFeedback: true, assignedDriverId: true },
        })
      : [];
    const jobById = new Map(jobs.map(job => [job.id, job]));
    const shaped = rows.map(row => {
      const booking = shapeBooking(row);
      const linkedJob = row.jobId ? jobById.get(row.jobId) : undefined;
      const operationalStatus = linkedJob?.status;
      return {
        ...booking,
        status: bookingStatusFromJob(operationalStatus, booking.status),
        operationalStatus: operationalStatus ?? null,
        customerRating: linkedJob?.customerRating ?? null,
        customerFeedback: linkedJob?.customerFeedback ?? null,
        assignedDriverId: linkedJob?.assignedDriverId ?? null,
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
    res.json({
      success: true,
      data: {
        ...b,
        status: bookingStatusFromJob(linkedJob?.status, b.status),
        operationalStatus: linkedJob?.status ?? null,
      },
      job: linkedJob ? shapeJob(linkedJob) : null,
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
    if (!b.name || !b.categorySlug || !b.description || !b.passengers || !b.imageUrl) {
      res.status(400).json({ success: false, message: 'Missing required fields' }); return;
    }
    const v = await prisma.websiteVehicle.create({
      data: { ...b, id: `wv-${uuid()}`, available: b.available !== false },
    });
    res.status(201).json({ success: true, data: v });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
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
    const { id: _id, ...data } = req.body;
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
    const drivers = await prisma.driver.findMany({ where, include: { documents: true } });
    const list = drivers.map(({ passwordHash: _, ...d }) => d);
    res.json({ success: true, data: list, total: list.length });
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
    const d = await prisma.driver.findUnique({ where: { id: req.params.id }, include: { documents: true } });
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
    const d = await prisma.driver.update({
      where: { id: req.params.id },
      data: { isApproved: approve },
      include: { documents: true },
    });
    const { passwordHash: _, ...safe } = d;
    res.json({ success: true, message: `Driver ${approve ? 'approved' : 'rejected'}`, data: safe });
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
router.get('/customers', async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany();
    const list = customers.map(({ passwordHash: _, ...c }) => c);
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
      driverPayoutPercentage: p.driverPayoutPercentage,
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
      driverPayoutPercentage?: number;
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
    if (b.driverPayoutPercentage !== undefined) data.driverPayoutPercentage = b.driverPayoutPercentage;
    const p = await prisma.pricingConfig.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', prestigeRatePerMile: 4.40, prestigeHourlyRate: 70, minibusRatePerMile: 4.00, minibusRate16Seater: 420, minibusRate24Seater: 520, minibusRate32Seater: 620, coachesRatePerMile: 4.00, coachesHourlyRate: 110, taxiRatePerMile: 3.00, taxiMinimumFare: 8, driverSearchRadiusMiles: 20, commissionPercentage: 27.5, driverPayoutPercentage: 60, ...data },
    });
    const shaped = {
      prestige: { ratePerMile: p.prestigeRatePerMile, hourlyRate: p.prestigeHourlyRate },
      minibus:  { ratePerMile: p.minibusRatePerMile, rate16Seater: p.minibusRate16Seater, rate24Seater: p.minibusRate24Seater, rate32Seater: p.minibusRate32Seater },
      coaches:  { ratePerMile: p.coachesRatePerMile, hourlyRate: p.coachesHourlyRate },
      taxi:     { ratePerMile: p.taxiRatePerMile, minimumFare: p.taxiMinimumFare },
      driverSearchRadiusMiles: p.driverSearchRadiusMiles,
      commissionPercentage: p.commissionPercentage,
      driverPayoutPercentage: p.driverPayoutPercentage,
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
    sectionsJson: [],
  },
];

router.get('/pages', async (_req: Request, res: Response) => {
  try {
    let pages = await prisma.websitePage.findMany({ orderBy: { slug: 'asc' } });
    if (pages.length === 0) {
      await prisma.websitePage.createMany({ data: DEFAULT_PAGES, skipDuplicates: true });
      pages = await prisma.websitePage.findMany({ orderBy: { slug: 'asc' } });
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
