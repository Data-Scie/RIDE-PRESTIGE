import { Router, Request, Response, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import type { FleetVehicle } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db';
import { storeDocumentFile, validateDocumentFile } from '../lib/documentUpload';
import { pushNotification } from '../services/notificationService';
import { isDriverDocumentEligible, isVehicleEligible } from '../services/dispatchService';
import type { Stop } from '../types';

const router = Router();
router.use(authenticate, requireRole('affiliate', 'admin', 'ops'));
const documentUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const uploadSingleDocument = documentUpload.single('document') as unknown as RequestHandler;

const getAffId = (req: Request): string => req.user!.affiliateId ?? req.user!.id;
const ACTIVE_DRIVER_JOB_STATUSES = ['driver_assigned', 'vehicle_assigned', 'driver_accepted', 'on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress'];
const AFFILIATE_DOCUMENTS = [
  { type: 'operator_licence', label: 'Operator Licence' },
  { type: 'insurance', label: 'Insurance Document' },
  { type: 'company_cert', label: 'Company Certificate' },
  { type: 'proof_of_address', label: 'Proof of Address' },
];

function isDocumentUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

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
  return prisma.affiliateDocument.findMany({
    where: { affiliateId },
    orderBy: { label: 'asc' },
  });
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
  return {
    id: j.id, bookingRef: j.bookingRef, bookingId: j.bookingId,
    customerId: j.customerId, customerName: j.customerName, customerPhone: j.customerPhone,
    pickupAddress: j.pickupAddress, dropoffAddress: j.dropoffAddress,
    stops: j.stops as Stop[],
    dateTime: j.dateTime.toISOString(),
    passengerCount: j.passengerCount, luggageCount: j.luggageCount,
    vehicleTypeRequested: j.vehicleTypeRequested, vehicleCategory: j.vehicleCategory,
    distance: j.distance, estimatedDuration: j.estimatedDuration,
    specialInstructions: j.specialInstructions,
    flightNumber: j.flightNumber, trainNumber: j.trainNumber,
    status: j.status, affiliateId: j.affiliateId,
    assignedDriverId: j.assignedDriverId, assignedVehicleId: j.assignedVehicleId,
    completedAt: j.completedAt?.toISOString() ?? null,
    customerRating: j.customerRating, customerFeedback: j.customerFeedback, driverRating: j.driverRating,
    createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString(),
    // What RP pays this affiliate after deducting commission. Customer fare is not exposed.
    yourEarnings: j.affiliatePayoutAmount,
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/affiliate/dashboard:
 *   get:
 *     summary: Affiliate dashboard statistics
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Dashboard stats }
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    // Get affiliate's vehicle categories first (needed to filter available jobs)
    const myVehiclesRaw = await prisma.fleetVehicle.findMany({ where: { affiliateId: affId } });
    const myCategories = [...new Set(
      myVehiclesRaw.filter(v => v.isApproved && v.approvalStatus === 'approved' && v.status === 'available')
        .map(v => v.vehicleCategory),
    )];
    const categoryFilter = myCategories.length > 0 ? { vehicleCategory: { in: myCategories } } : {};
    const [
      aff, pendingJobsList, myJobs, myDrivers, myEarnings,
    ] = await Promise.all([
      prisma.affiliate.findUnique({ where: { id: affId } }),
      prisma.job.findMany({ where: { status: 'awaiting_affiliate', ...categoryFilter }, orderBy: { dateTime: 'asc' }, take: 1 }),
      prisma.job.findMany({ where: { affiliateId: affId } }),
      prisma.driver.findMany({ where: { affiliateId: affId } }),
      prisma.earningEntry.findMany({ where: { entityId: affId, entityType: 'affiliate' } }),
    ]);
    const myVehicles = myVehiclesRaw;
    const today = new Date().toISOString().slice(0, 10);
    const activeRides     = myJobs.filter(j => !['completed', 'cancelled', 'rejected', 'awaiting_affiliate'].includes(j.status)).length;
    const completedJobs   = myJobs.filter(j => j.status === 'completed').length;
    const pendingAllocations = myJobs.filter(j => j.status === 'needs_allocation').length;
    const pendingRidesAll = await prisma.job.count({ where: { status: 'awaiting_affiliate', ...categoryFilter } });
    const totalEarnings   = parseFloat(myEarnings.reduce((s, e) => s + e.netAmount, 0).toFixed(2));
    const todayEarnings   = parseFloat(myEarnings.filter(e => e.date.toISOString().startsWith(today)).reduce((s, e) => s + e.netAmount, 0).toFixed(2));
    const pendingPayout   = parseFloat(myEarnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.netAmount, 0).toFixed(2));
    const firstPending    = pendingJobsList[0];

    res.json({
      success: true,
      data: {
        companyName:      aff?.companyName ?? 'Affiliate',
        contactPerson:    aff?.contactPerson ?? '',
        rating:           aff?.rating ?? 0,
        activeRides,
        newJobs:           pendingRidesAll,
        acceptedJobs:      myJobs.length,
        pendingAllocations,
        availableDrivers: myDrivers.filter(d => d.status === 'available').length,
        totalJobs:        (aff?.totalJobs ?? 0) + completedJobs,
        pendingRides:     pendingRidesAll,
        pendingRidePreview: firstPending ? {
          bookingRef:     firstPending.bookingRef,
          pickupAddress:  firstPending.pickupAddress,
          dropoffAddress: firstPending.dropoffAddress,
          yourEarnings:   firstPending.affiliatePayoutAmount,
        } : undefined,
        totalDrivers:     myDrivers.length,
        driversAvailable: myDrivers.filter(d => d.status === 'available').length,
        totalVehicles:    myVehicles.length,
        vehiclesAvailable: myVehicles.filter(v => v.status === 'available').length,
        todayEarnings,
        totalEarnings,
        pendingPayout,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Jobs ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/affiliate/jobs/new:
 *   get:
 *     summary: Get jobs available to accept
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: New available jobs }
 */
router.get('/jobs/new', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    // Only show jobs whose vehicle category matches a vehicle this affiliate has
    const myVehicleCategories = await prisma.fleetVehicle.findMany({
      where: { affiliateId: affId, isApproved: true, approvalStatus: 'approved', status: 'available' },
      select: { vehicleCategory: true },
      distinct: ['vehicleCategory'],
    });
    const categories = myVehicleCategories.map(v => v.vehicleCategory);
    const jobs = await prisma.job.findMany({
      where: {
        status: 'awaiting_affiliate',
        ...(categories.length > 0 ? { vehicleCategory: { in: categories } } : {}),
      },
      orderBy: { dateTime: 'asc' },
    });
    const list = jobs.map(shapeJob);
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/jobs/accepted:
 *   get:
 *     summary: Get jobs accepted by this affiliate
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Accepted jobs }
 */
router.get('/jobs/accepted', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const jobs = await prisma.job.findMany({
      where: {
        affiliateId: affId,
        status: { notIn: ['awaiting_affiliate', 'cancelled', 'rejected', 'completed'] },
      },
      orderBy: { dateTime: 'asc' },
    });
    const list = jobs.map(shapeJob);
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/jobs/history:
 *   get:
 *     summary: Completed / cancelled jobs history
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Job history }
 */
router.get('/jobs/history', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const jobs = await prisma.job.findMany({
      where: {
        affiliateId: affId,
        status: { in: ['completed', 'cancelled', 'rejected'] },
      },
      orderBy: { dateTime: 'desc' },
    });
    const list = jobs.map(shapeJob);
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/jobs/{id}:
 *   get:
 *     summary: Get a job by ID
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Job }
 */
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
    res.json({ success: true, data: shapeJob(job) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/jobs/{id}/accept:
 *   post:
 *     summary: Accept a job
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Job accepted }
 */
router.post('/jobs/:id/accept', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
    if (job.status !== 'awaiting_affiliate') {
      res.status(409).json({ success: false, message: `Cannot accept job in status: ${job.status}` }); return;
    }
    const updated = await prisma.$transaction(async tx => {
      const claimed = await tx.job.updateMany({
        where: { id: job.id, status: 'awaiting_affiliate', affiliateId: null, assignedDriverId: null },
        data: { affiliateId: affId, status: 'needs_allocation' },
      });
      if (claimed.count !== 1) throw new Error('RIDE_ALREADY_CLAIMED');
      const updatedJob = await tx.job.findUniqueOrThrow({ where: { id: job.id } });
      await tx.rideOffer.updateMany({
        where: { jobId: job.id, status: 'pending' },
        data: { status: 'withdrawn', respondedAt: new Date() },
      });
      await tx.booking.updateMany({
        where: { OR: [{ id: job.bookingId ?? '' }, { jobId: job.id }] },
        data: { status: 'accepted' },
      });
      await tx.rideStatusHistory.create({
        data: { jobId: job.id, fromStatus: job.status, toStatus: 'needs_allocation', changedBy: affId, changedByRole: 'affiliate', notes: 'Affiliate accepted job' },
      });
      return updatedJob;
    });
    res.json({ success: true, message: 'Job accepted', data: shapeJob(updated) });
  } catch (e) {
    if (e instanceof Error && e.message === 'RIDE_ALREADY_CLAIMED') {
      res.status(409).json({ success: false, message: 'This ride has already been claimed' });
      return;
    }
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/jobs/{id}/reject:
 *   post:
 *     summary: Reject a job
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Job rejected }
 */
router.post('/jobs/:id/reject', async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
    const updated = await prisma.job.update({ where: { id: job.id }, data: { status: 'rejected' } });
    res.json({ success: true, message: 'Job rejected', data: shapeJob(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/jobs/{id}/assign-driver:
 *   post:
 *     summary: Assign a driver to a job
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driverId: { type: string }
 *     responses:
 *       200: { description: Driver assigned }
 */
router.post('/jobs/:id/assign-driver', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const job = await prisma.job.findFirst({ where: { id: req.params.id, affiliateId: affId } });
    if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
    if (!['needs_allocation', 'vehicle_assigned', 'driver_assigned'].includes(job.status)) {
      res.status(409).json({ success: false, message: `Cannot assign a driver in status: ${job.status}` }); return;
    }
    const { driverId } = req.body as { driverId: string };
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, affiliateId: affId, isApproved: true },
      include: { documents: true },
    });
    if (!driver) { res.status(404).json({ success: false, message: 'Driver not found or not approved' }); return; }
    if (driver.documentsStatus !== 'approved' || !isDriverDocumentEligible(driver.documents)) {
      res.status(409).json({ success: false, message: 'Driver documents are not approved and current' }); return;
    }
    if (driver.status !== 'available' && job.assignedDriverId !== driverId) {
      res.status(409).json({ success: false, message: 'Driver is not available' }); return;
    }
    if (job.assignedDriverId !== driverId) {
      const activeJob = await prisma.job.findFirst({
        where: {
          assignedDriverId: driverId,
          id: { not: job.id },
          status: { in: ACTIVE_DRIVER_JOB_STATUSES },
        },
        select: { bookingRef: true },
      });
      if (activeJob) {
        res.status(409).json({ success: false, message: `Driver already has active ride ${activeJob.bookingRef}` }); return;
      }
    }
    const nextStatus = job.assignedVehicleId ? 'vehicle_assigned' : 'driver_assigned';
    const updated = await prisma.$transaction(async tx => {
      const updatedJob = await tx.job.update({ where: { id: job.id }, data: { assignedDriverId: driverId, status: nextStatus } });
      await tx.driver.update({ where: { id: driverId }, data: { status: 'busy' } });
      await tx.rideStatusHistory.create({
        data: { jobId: job.id, fromStatus: job.status, toStatus: nextStatus, changedBy: affId, changedByRole: 'affiliate', notes: `Driver ${driver.fullName} assigned` },
      });
      return updatedJob;
    });
    await pushNotification(driverId, 'driver', 'Job Assigned', `You have been assigned to job ${job.bookingRef}. Pickup: ${job.pickupAddress}`, 'job');
    res.json({ success: true, message: 'Driver assigned', data: shapeJob(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/jobs/{id}/assign-vehicle:
 *   post:
 *     summary: Assign a vehicle to a job
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleId: { type: string }
 *     responses:
 *       200: { description: Vehicle assigned }
 */
router.post('/jobs/:id/assign-vehicle', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const job = await prisma.job.findFirst({ where: { id: req.params.id, affiliateId: affId } });
    if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
    if (!['needs_allocation', 'driver_assigned', 'vehicle_assigned'].includes(job.status)) {
      res.status(409).json({ success: false, message: `Cannot assign a vehicle in status: ${job.status}` }); return;
    }
    const { vehicleId } = req.body as { vehicleId: string };
    const vehicle = await prisma.fleetVehicle.findFirst({
      where: {
        id: vehicleId,
        affiliateId: affId,
        isApproved: true,
        approvalStatus: 'approved',
        OR: [{ status: 'available' }, ...(job.assignedVehicleId === vehicleId ? [{ status: 'in_use' }] : [])],
      },
    });
    if (!vehicle) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
    if (!isVehicleEligible(vehicle, job)) {
      res.status(409).json({ success: false, message: 'Vehicle does not meet category, capacity, or compliance requirements' }); return;
    }
    const updated = await prisma.$transaction(async tx => {
      if (job.assignedVehicleId && job.assignedVehicleId !== vehicleId) {
        await tx.fleetVehicle.update({ where: { id: job.assignedVehicleId }, data: { status: 'available' } });
      }
      const updatedJob = await tx.job.update({ where: { id: job.id }, data: { assignedVehicleId: vehicleId, status: 'vehicle_assigned' } });
      await tx.fleetVehicle.update({ where: { id: vehicleId }, data: { status: 'in_use' } });
      await tx.rideStatusHistory.create({
        data: { jobId: job.id, fromStatus: job.status, toStatus: 'vehicle_assigned', changedBy: affId, changedByRole: 'affiliate', notes: `Vehicle ${vehicle.registration} assigned` },
      });
      return updatedJob;
    });
    if (job.assignedDriverId) {
      await pushNotification(job.assignedDriverId, 'driver', 'Vehicle Allocated', `Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.registration}) allocated to job ${job.bookingRef}.`, 'job');
    }
    res.json({ success: true, message: 'Vehicle assigned', data: shapeJob(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Drivers ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/affiliate/drivers:
 *   get:
 *     summary: List affiliate's drivers
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Drivers }
 */
router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const { status, jobId } = req.query as { status?: string; jobId?: string };
    const job = jobId
      ? await prisma.job.findFirst({
          where: {
            id: jobId,
            OR: [
              { affiliateId: affId },
              { status: 'awaiting_affiliate', affiliateId: null },
            ],
          },
        })
      : null;
    const drivers = await prisma.driver.findMany({
      where: { affiliateId: affId, ...(status ? { status } : {}) },
      include: { documents: true },
      orderBy: { joinedDate: 'desc' },
    });
    const eligibleDrivers = jobId
      ? (job ? drivers.filter(driver =>
          driver.isApproved
          && driver.applicationStatus === 'approved'
          && driver.status === 'available'
          && driver.documentsStatus === 'approved'
          && isDriverDocumentEligible(driver.documents)) : [])
      : drivers;
    const list = eligibleDrivers.map(({ passwordHash: _, ...d }) => d);
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/drivers:
 *   post:
 *     summary: Add a driver under this affiliate
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, phone, password, drivingLicenceNumber, privateHireBadgeNumber]
 *             properties:
 *               fullName:               { type: string }
 *               email:                  { type: string }
 *               phone:                  { type: string }
 *               password:               { type: string }
 *               drivingLicenceNumber:   { type: string }
 *               privateHireBadgeNumber: { type: string }
 *     responses:
 *       201: { description: Driver added }
 */
router.post('/drivers', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const b = req.body as {
      fullName: string; email: string; phone: string; password: string;
      address?: string; city?: string; postcode?: string; dateOfBirth?: string;
      drivingLicenceNumber?: string; privateHireBadgeNumber?: string;
    };
    if (!b.fullName || !b.email || !b.phone || !b.password) {
      res.status(400).json({ success: false, message: 'Missing required fields' }); return;
    }
    const existing = await prisma.driver.findUnique({ where: { email: b.email } });
    if (existing) { res.status(409).json({ success: false, message: 'Email already registered' }); return; }
    const drvId = `drv-${uuid()}`;
    const newDriver = await prisma.driver.create({
      data: {
        id: drvId,
        fullName: b.fullName, email: b.email, phone: b.phone,
        passwordHash: bcrypt.hashSync(b.password, 10),
        address: b.address ?? '', city: b.city ?? '', postcode: b.postcode ?? '',
        dateOfBirth: b.dateOfBirth ?? '', drivingLicenceNumber: b.drivingLicenceNumber ?? '',
        privateHireBadgeNumber: b.privateHireBadgeNumber ?? '',
        driverType: 'affiliateDriver',
        affiliateId: affId,
        status: 'offline',
        rating: 0, totalJobs: 0, totalEarnings: 0,
        documentsStatus: 'missing',
        isApproved: false,
        applicationStatus: 'pending',
        documents: {
          create: [
            { id: uuid(), type: 'driving_licence', label: 'Driving Licence', status: 'missing' },
            { id: uuid(), type: 'phv_badge',       label: 'PHV Badge',       status: 'missing' },
            { id: uuid(), type: 'dbs_check',       label: 'DBS Check',       status: 'missing' },
            { id: uuid(), type: 'insurance',       label: 'Insurance Certificate', status: 'missing' },
          ],
        },
      },
      include: { documents: true },
    });
    const { passwordHash: _, ...safe } = newDriver;
    res.status(201).json({ success: true, message: 'Driver added. Pending admin approval.', data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/drivers/{id}:
 *   get:
 *     summary: Get a driver by ID
 *     tags: [Affiliate]
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
    const affId = getAffId(req);
    const d = await prisma.driver.findFirst({
      where: { id: req.params.id, affiliateId: affId },
      include: { documents: true },
    });
    if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const { passwordHash: _, ...safe } = d;
    const driverJobs = await prisma.job.findMany({ where: { assignedDriverId: d.id } });
    res.json({ success: true, data: safe, jobs: driverJobs.map(shapeJob) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/drivers/:id/status', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const { status } = req.body as { status?: 'available' | 'busy' | 'offline' };
    if (!status || !['available', 'busy', 'offline'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid driver status' });
      return;
    }
    const driver = await prisma.driver.findFirst({
      where: { id: req.params.id, affiliateId: affId },
    });
    if (!driver) {
      res.status(404).json({ success: false, message: 'Driver not found' });
      return;
    }
    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: { status },
    });
    const { passwordHash: _, ...safe } = updated;
    res.json({ success: true, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/drivers/:id/remove', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const d = await prisma.driver.findFirst({ where: { id: req.params.id, affiliateId: affId } });
    if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    await prisma.driver.delete({ where: { id: d.id } });
    res.json({ success: true, message: 'Driver removed' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Vehicles ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/affiliate/vehicles:
 *   get:
 *     summary: List affiliate's fleet vehicles
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Vehicles }
 */
router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const { status, jobId } = req.query as { status?: string; jobId?: string };
    const vehicles = await prisma.fleetVehicle.findMany({
      where: { affiliateId: affId, ...(status ? { status } : {}) },
    });
    const job = jobId
      ? await prisma.job.findFirst({
          where: {
            id: jobId,
            OR: [
              { affiliateId: affId },
              { status: 'awaiting_affiliate', affiliateId: null },
            ],
          },
        })
      : null;
    const list = jobId ? (job ? vehicles.filter(vehicle => isVehicleEligible(vehicle, job)) : []) : vehicles;
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.get('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const vehicle = await prisma.fleetVehicle.findFirst({
      where: { id: req.params.id, affiliateId: affId },
    });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }
    res.json({ success: true, data: vehicle });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/vehicles:
 *   post:
 *     summary: Add a vehicle to affiliate fleet
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [make, model, year, registration, vehicleType, vehicleCategory, colour, passengerCapacity, luggageCapacity]
 *             properties:
 *               make:              { type: string }
 *               model:             { type: string }
 *               year:              { type: number }
 *               registration:      { type: string }
 *               vehicleType:       { type: string }
 *               vehicleCategory:   { type: string }
 *               colour:            { type: string }
 *               passengerCapacity: { type: number }
 *               luggageCapacity:   { type: number }
 *               motExpiry:         { type: string }
 *               insuranceExpiry:   { type: string }
 *               phvLicenceExpiry:  { type: string }
 *     responses:
 *       201: { description: Vehicle added }
 */
router.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const b = req.body as {
      make?: string;
      model?: string;
      year?: number;
      registration?: string;
      vehicleType?: string;
      vehicleCategory?: string;
      colour?: string;
      passengerCapacity?: number;
      luggageCapacity?: number;
      motExpiry?: string;
      insuranceExpiry?: string;
      phvLicenceExpiry?: string;
    };
    const required = [
      b.make, b.model, b.year, b.registration, b.vehicleType, b.vehicleCategory,
      b.colour, b.passengerCapacity, b.motExpiry, b.insuranceExpiry, b.phvLicenceExpiry,
    ];
    if (required.some(value => value === undefined || value === null || value === '')) {
      res.status(400).json({ success: false, message: 'Please complete all required vehicle and compliance fields' });
      return;
    }
    if (!['prestige', 'minibus', 'coaches', 'taxi'].includes(b.vehicleCategory!)) {
      res.status(400).json({ success: false, message: 'Invalid vehicle category' });
      return;
    }
    if (Number(b.year) < 1980 || Number(b.year) > new Date().getFullYear() + 1) {
      res.status(400).json({ success: false, message: 'Invalid vehicle year' });
      return;
    }
    if (Number(b.passengerCapacity) < 1 || Number(b.luggageCapacity) < 0) {
      res.status(400).json({ success: false, message: 'Invalid passenger or luggage capacity' });
      return;
    }
    const v = await prisma.fleetVehicle.create({
      data: {
        id: `fv-${uuid()}`,
        make: b.make!.trim(),
        model: b.model!.trim(),
        year: Number(b.year),
        registration: b.registration!.trim().toUpperCase(),
        vehicleType: b.vehicleType!,
        vehicleCategory: b.vehicleCategory!,
        colour: b.colour!.trim(),
        passengerCapacity: Number(b.passengerCapacity),
        luggageCapacity: Number(b.luggageCapacity ?? 0),
        motExpiry: b.motExpiry!,
        insuranceExpiry: b.insuranceExpiry!,
        phvLicenceExpiry: b.phvLicenceExpiry!,
        status: 'available',
        affiliateId: affId,
      },
    });
    res.status(201).json({ success: true, data: v });
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'code' in e && e.code === 'P2002') {
      res.status(409).json({ success: false, message: 'A vehicle with this registration already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/vehicles/{id}:
 *   put:
 *     summary: Update a vehicle
 *     tags: [Affiliate]
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
router.put('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const exists = await prisma.fleetVehicle.findFirst({
      where: { id: req.params.id, affiliateId: affId },
    });
    if (!exists) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
    const b = req.body as Partial<FleetVehicle>;
    const data: Partial<FleetVehicle> = {};
    if (b.make !== undefined) data.make = b.make;
    if (b.model !== undefined) data.model = b.model;
    if (b.year !== undefined) data.year = Number(b.year);
    if (b.registration !== undefined) data.registration = String(b.registration).toUpperCase();
    if (b.colour !== undefined) data.colour = b.colour;
    if (b.vehicleType !== undefined) data.vehicleType = b.vehicleType;
    if (b.vehicleCategory !== undefined) data.vehicleCategory = b.vehicleCategory;
    if (b.passengerCapacity !== undefined) data.passengerCapacity = Number(b.passengerCapacity);
    if (b.luggageCapacity !== undefined) data.luggageCapacity = Number(b.luggageCapacity);
    if (b.motExpiry !== undefined) data.motExpiry = b.motExpiry;
    if (b.insuranceExpiry !== undefined) data.insuranceExpiry = b.insuranceExpiry;
    if (b.phvLicenceExpiry !== undefined) data.phvLicenceExpiry = b.phvLicenceExpiry;
    data.isApproved = false;
    data.approvalStatus = 'pending';
    data.rejectionReason = null;
    const v = await prisma.fleetVehicle.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: v });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/vehicles/:id/status', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const { status } = req.body as { status?: 'available' | 'in_use' | 'maintenance' | 'offline' };
    const allowed = ['available', 'in_use', 'maintenance', 'offline'];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid vehicle status' });
      return;
    }
    const vehicle = await prisma.fleetVehicle.findFirst({
      where: { id: req.params.id, affiliateId: affId },
    });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }
    const updated = await prisma.fleetVehicle.update({
      where: { id: vehicle.id },
      data: { status },
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/vehicles/:id/remove', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const v = await prisma.fleetVehicle.findFirst({ where: { id: req.params.id, affiliateId: affId } });
    if (!v) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
    await prisma.fleetVehicle.delete({ where: { id: v.id } });
    res.json({ success: true, message: 'Vehicle removed' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Earnings ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/affiliate/earnings:
 *   get:
 *     summary: Get affiliate's earnings
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Earnings }
 */
router.get('/earnings', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const myEarnings = await prisma.earningEntry.findMany({
      where: { entityId: affId, entityType: 'affiliate' },
      orderBy: { date: 'desc' },
    });
    const shaped = myEarnings.map(e => ({ ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() }));
    const today = new Date().toISOString().slice(0, 10);
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const summary = {
      today:    parseFloat(shaped.filter(e => e.date.startsWith(today)).reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      thisWeek: parseFloat(shaped.filter(e => e.date >= thisWeekStart.toISOString()).reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      total:    parseFloat(shaped.reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      paid:     parseFloat(shaped.filter(e => e.status === 'paid').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      pending:  parseFloat(shaped.filter(e => e.status === 'pending').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      jobCount: shaped.length,
    };
    res.json({ success: true, data: shaped, summary });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/affiliate/profile:
 *   get:
 *     summary: Get affiliate profile
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Profile }
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const a = await prisma.affiliate.findUnique({ where: { id: affId } });
    if (!a) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
    const { passwordHash: _, ...safe } = a;
    res.json({ success: true, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/profile:
 *   put:
 *     summary: Update affiliate profile
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Updated profile }
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const { passwordHash: _ph, id: _id, isApproved: _ia, createdAt: _ca, ...allowed } = req.body;
    const a = await prisma.affiliate.update({ where: { id: affId }, data: allowed });
    const { passwordHash: _, ...safe } = a;
    res.json({ success: true, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/affiliate/notifications:
 *   get:
 *     summary: Get affiliate notifications
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Notifications }
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const list = await prisma.notification.findMany({
      where: { recipientId: affId },
      orderBy: { createdAt: 'desc' },
    });
    const shaped = list.map(n => ({ ...n, createdAt: n.createdAt.toISOString() }));
    res.json({ success: true, data: shaped, unread: shaped.filter(n => !n.isRead).length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, recipientId: affId },
    });
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/affiliate/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Affiliate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Marked read }
 */
router.put('/notifications/read-all', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    await prisma.notification.updateMany({ where: { recipientId: affId }, data: { isRead: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Documents ────────────────────────────────────────────────────────────────

router.get('/documents', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const aff = await prisma.affiliate.findUnique({ where: { id: affId } });
    if (!aff) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
    const docs = await ensureAffiliateDocuments(affId);
    res.json({ success: true, data: docs });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/documents/:id', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const { fileUrl, expiryDate } = req.body as { fileUrl?: string; expiryDate?: string };
    const expiry = expiryDate ? new Date(`${expiryDate}T23:59:59.999Z`) : null;
    if (!fileUrl || !isDocumentUrl(fileUrl) || !expiryDate || !expiry || expiry.getTime() < Date.now()) {
      res.status(400).json({ success: false, message: 'A document URL and current expiry date are required' });
      return;
    }
    const document = await prisma.affiliateDocument.findFirst({ where: { id: req.params.id, affiliateId: affId } });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const updated = await prisma.affiliateDocument.update({
      where: { id: document.id },
      data: { fileUrl, expiryDate, status: 'pending', uploadedAt: new Date(), rejectionReason: null },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/documents/:id/upload', uploadSingleDocument, async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const { expiryDate } = req.body as { expiryDate?: string };
    const expiry = expiryDate ? new Date(`${expiryDate}T23:59:59.999Z`) : null;
    if (!expiryDate || !expiry || expiry.getTime() < Date.now()) {
      res.status(400).json({ success: false, message: 'A current expiry date is required' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Document file is required' });
      return;
    }
    const validationError = validateDocumentFile(req.file);
    if (validationError) {
      res.status(400).json({ success: false, message: validationError });
      return;
    }
    const document = await prisma.affiliateDocument.findFirst({ where: { id: req.params.id, affiliateId: affId } });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const fileUrl = await storeDocumentFile(req, req.file, affId, document.type);
    const updated = await prisma.affiliateDocument.update({
      where: { id: document.id },
      data: { fileUrl, expiryDate, status: 'pending', uploadedAt: new Date(), rejectionReason: null },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Document upload failed' });
  }
});

// ─── Push Token ───────────────────────────────────────────────────────────────

router.put('/push-token', async (req: Request, res: Response) => {
  try {
    const affId = getAffId(req);
    const { token } = req.body as { token?: string };
    if (!token) { res.status(400).json({ success: false, message: 'Token required' }); return; }
    await prisma.affiliate.update({ where: { id: affId }, data: { expoPushToken: token } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

export default router;
