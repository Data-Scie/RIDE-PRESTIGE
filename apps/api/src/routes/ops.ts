import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db';
import {
  areVehicleDocumentsApproved,
  ensureVehicleDocuments,
  hasCurrentDocumentFile as hasCurrentVehicleDocumentFile,
  syncVehicleDocumentExpiries,
} from '../lib/vehicleDocuments';
import { applyCommission, getPricingConfig } from '../services/fareService';
import { pushNotification } from '../services/notificationService';
import { recordRideFlowEvent, shapeRideFlowEvent } from '../lib/rideFlow';
import { ensureDriverDocuments } from '../lib/driverDocuments';
import type { Job, JobStatus, Stop } from '../types';

const router = Router();
router.use(authenticate, requireRole('admin', 'ops'));

const ACTIVE_DRIVER_JOB_STATUSES = ['driver_assigned', 'vehicle_assigned', 'driver_accepted', 'on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress'];

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
    ...j,
    stops: j.stops as Stop[],
    dateTime: j.dateTime.toISOString(),
    completedAt: j.completedAt?.toISOString() ?? null,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ops/dashboard:
 *   get:
 *     summary: Operations dashboard
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Ops stats }
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [
      activeRides, awaitingAffiliate, needsAllocation, completedToday,
      totalDrivers, availableDrivers, totalAffiliates,
      pendingDriverCount, pendingAffCount, pendingVehicleCount,
      todayRevenueAgg, todayCommissionAgg,
    ] = await Promise.all([
      prisma.job.count({ where: { status: { in: ['on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress'] } } }),
      prisma.job.count({ where: { status: 'awaiting_affiliate' } }),
      prisma.job.count({ where: { status: 'needs_allocation' } }),
      prisma.job.count({ where: { status: 'completed', completedAt: { gte: todayStart } } }),
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'available', isApproved: true } }),
      prisma.affiliate.count(),
      prisma.driver.count({ where: { applicationStatus: 'pending' } }),
      prisma.affiliate.count({ where: { isApproved: false } }),
      prisma.fleetVehicle.count({ where: { approvalStatus: 'pending' } }),
      prisma.job.aggregate({ _sum: { fareAmount: true }, where: { status: 'completed', completedAt: { gte: todayStart } } }),
      prisma.job.aggregate({ _sum: { commissionAmount: true }, where: { status: 'completed', completedAt: { gte: todayStart } } }),
    ]);
    res.json({
      success: true,
      data: {
        activeRides, awaitingAffiliate, needsAllocation, completedToday,
        totalDrivers, availableDrivers, totalAffiliates,
        pendingApprovals: pendingDriverCount + pendingAffCount + pendingVehicleCount,
        pendingVehicles: pendingVehicleCount,
        // today's RP financial picture
        todayGrossRevenue: parseFloat((todayRevenueAgg._sum.fareAmount ?? 0).toFixed(2)),
        todayRpCommission: parseFloat((todayCommissionAgg._sum.commissionAmount ?? 0).toFixed(2)),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Rides / Jobs ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ops/rides:
 *   get:
 *     summary: List all rides (ops view)
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: affiliateId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Rides }
 */
router.get('/rides', async (req: Request, res: Response) => {
  try {
    const { status, affiliateId } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (affiliateId) where.affiliateId = affiliateId;
    const jobs = await prisma.job.findMany({ where, orderBy: { dateTime: 'desc' } });
    const affiliateIds = [...new Set(jobs.map(job => job.affiliateId).filter((id): id is string => Boolean(id)))];
    const driverIds = [...new Set(jobs.map(job => job.assignedDriverId).filter((id): id is string => Boolean(id)))];
    const vehicleIds = [...new Set(jobs.map(job => job.assignedVehicleId).filter((id): id is string => Boolean(id)))];
    const [affiliates, drivers, vehicles] = await Promise.all([
      prisma.affiliate.findMany({ where: { id: { in: affiliateIds } }, select: { id: true, companyName: true, tradingName: true } }),
      prisma.driver.findMany({ where: { id: { in: driverIds } }, select: { id: true, fullName: true, driverType: true } }),
      prisma.fleetVehicle.findMany({ where: { id: { in: vehicleIds } }, select: { id: true, make: true, model: true, registration: true } }),
    ]);
    const affiliateById = new Map(affiliates.map(affiliate => [affiliate.id, affiliate]));
    const driverById = new Map(drivers.map(driver => [driver.id, driver]));
    const vehicleById = new Map(vehicles.map(vehicle => [vehicle.id, vehicle]));
    const list = jobs.map(job => {
      const affiliate = job.affiliateId ? affiliateById.get(job.affiliateId) : null;
      const driver = job.assignedDriverId ? driverById.get(job.assignedDriverId) : null;
      const vehicle = job.assignedVehicleId ? vehicleById.get(job.assignedVehicleId) : null;
      return {
        ...shapeJob(job),
        affiliateName: affiliate?.companyName ?? affiliate?.tradingName ?? null,
        driverName: driver?.fullName ?? null,
        driverType: driver?.driverType ?? null,
        vehicleLabel: vehicle ? `${vehicle.registration} - ${vehicle.make} ${vehicle.model}` : null,
      };
    });
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/ops/rides/{id}:
 *   get:
 *     summary: Get a single ride with full context
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Ride with driver, affiliate, vehicle info }
 */
router.get('/rides/:id', async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ success: false, message: 'Ride not found' }); return; }
    const [driver, affiliate, vehicle, flowEvents] = await Promise.all([
      job.assignedDriverId ? prisma.driver.findUnique({ where: { id: job.assignedDriverId } }) : null,
      job.affiliateId ? prisma.affiliate.findUnique({ where: { id: job.affiliateId } }) : null,
      job.assignedVehicleId ? prisma.fleetVehicle.findUnique({ where: { id: job.assignedVehicleId } }) : null,
      (prisma as any).rideFlowEvent.findMany({ where: { jobId: job.id }, orderBy: { createdAt: 'asc' } }),
    ]);
    const safeDriver = driver ? (({ passwordHash: _, ...d }) => d)(driver) : null;
    const safeAffiliate = affiliate ? (({ passwordHash: _, ...a }) => a)(affiliate) : null;
    res.json({ success: true, data: shapeJob(job), driver: safeDriver, affiliate: safeAffiliate, vehicle: vehicle ?? null, flowEvents: flowEvents.map(shapeRideFlowEvent) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/ops/rides:
 *   post:
 *     summary: Create a new ride / job manually
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, customerPhone, pickupAddress, dropoffAddress, dateTime, passengerCount, vehicleCategory, fareAmount]
 *             properties:
 *               customerName:      { type: string }
 *               customerPhone:     { type: string }
 *               customerEmail:     { type: string }
 *               pickupAddress:     { type: string }
 *               dropoffAddress:    { type: string }
 *               dateTime:          { type: string, example: "2026-07-01T09:00:00Z" }
 *               passengerCount:    { type: number }
 *               luggageCount:      { type: number }
 *               vehicleCategory:   { type: string, enum: [prestige, minibus, coaches, taxi] }
 *               fareAmount:        { type: number }
 *               specialInstructions: { type: string }
 *               flightNumber:      { type: string }
 *     responses:
 *       201: { description: Job created }
 */
router.post('/rides', async (req: Request, res: Response) => {
  try {
    const b = req.body as Partial<Job>;
    if (!b.customerName || !b.customerPhone || !b.pickupAddress || !b.dropoffAddress || !b.dateTime || !b.fareAmount) {
      res.status(400).json({ success: false, message: 'Missing required fields' }); return;
    }
    const pricing = await getPricingConfig();
    const { commission, affiliatePayout, driverPayout } = applyCommission(b.fareAmount!, pricing);
    const totalJobs = await prisma.job.count();
    const ref = `RP-${new Date().getFullYear()}-${String(totalJobs + 2000).padStart(4, '0')}`;
    const job = await prisma.job.create({
      data: {
        id: `job-${uuid()}`,
        bookingRef: ref,
        customerName: b.customerName!,
        customerPhone: b.customerPhone!,
        customerEmail: b.customerEmail,
        pickupAddress: b.pickupAddress!,
        dropoffAddress: b.dropoffAddress!,
        stops: (b.stops ?? []) as unknown as Prisma.InputJsonValue,
        dateTime: new Date(b.dateTime!),
        passengerCount: b.passengerCount ?? 1,
        luggageCount: b.luggageCount ?? 0,
        vehicleTypeRequested: b.vehicleTypeRequested ?? 'Executive',
        vehicleCategory: b.vehicleCategory ?? 'prestige',
        fareAmount: b.fareAmount!,
        commissionAmount: commission,
        affiliatePayoutAmount: affiliatePayout,
        driverPayoutAmount: driverPayout,
        distance: b.distance ?? 'TBC',
        estimatedDuration: b.estimatedDuration ?? 'TBC',
        specialInstructions: b.specialInstructions,
        flightNumber: b.flightNumber,
        trainNumber: b.trainNumber,
        status: 'awaiting_affiliate',
      },
    });
    await recordRideFlowEvent({
      job,
      eventType: 'ride_created_by_ops',
      title: 'Ride created by operations',
      description: `${job.customerName} - ${job.pickupAddress} to ${job.dropoffAddress}`,
      fromStatus: null,
      toStatus: 'awaiting_affiliate',
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? 'ops',
      metadata: { fareAmount: job.fareAmount, vehicleCategory: job.vehicleCategory },
    });
    // Notify only affiliates with a matching vehicle category
    const jobCategory = b.vehicleCategory ?? 'prestige';
    const approvedAffiliates = await prisma.affiliate.findMany({
      where: {
        isApproved: true,
        fleetVehicles: { some: { vehicleCategory: jobCategory, isApproved: true, approvalStatus: 'approved', status: 'available' } },
      },
    });
    for (const a of approvedAffiliates) {
      await pushNotification(a.id, 'affiliate', 'New Job Available', `Job ${ref} is available — ${job.pickupAddress} → ${job.dropoffAddress}`, 'job');
    }
    res.status(201).json({ success: true, data: shapeJob(job) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/ops/rides/{id}/status:
 *   put:
 *     summary: Update a ride status
 *     tags: [Operations]
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
 *               status: { type: string, enum: [awaiting_affiliate, accepted_by_affiliate, needs_allocation, driver_assigned, vehicle_assigned, driver_accepted, on_route, arrived_pickup, passenger_onboard, in_progress, completed, cancelled, rejected] }
 *     responses:
 *       200: { description: Updated ride }
 */
router.put('/rides/:id/status', async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ success: false, message: 'Ride not found' }); return; }
    const { status } = req.body as { status: JobStatus };
    const updated = await prisma.job.update({ where: { id: job.id }, data: { status, ...(status === 'completed' ? { completedAt: new Date() } : {}) } });
    await recordRideFlowEvent({
      job: updated,
      eventType: 'status_changed',
      title: `Status changed to ${status.replace(/_/g, ' ')}`,
      fromStatus: job.status,
      toStatus: status,
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? 'ops',
    });

    // Auto-create earnings when completed
    if (status === 'completed' && job.assignedDriverId) {
      const now = new Date();
      if (job.affiliateId) {
        await prisma.earningEntry.create({
          data: {
            id: `earn-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
            entityId: job.affiliateId, entityType: 'affiliate',
            date: now, grossAmount: job.affiliatePayoutAmount,
            commissionDeducted: 0, netAmount: job.affiliatePayoutAmount, status: 'pending',
          },
        });
      } else {
        await prisma.earningEntry.create({
          data: {
            id: `earn-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
            entityId: job.assignedDriverId, entityType: 'driver',
            date: now, grossAmount: job.affiliatePayoutAmount,
            commissionDeducted: 0, netAmount: job.affiliatePayoutAmount, status: 'pending',
          },
        });
      }
      await prisma.payment.create({
        data: {
          id: `pay-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
          customerId: job.customerId, customerName: job.customerName,
          amount: job.fareAmount, method: 'cash', status: 'paid', paidAt: now,
        },
      });
      // Update linked booking
      const bk = await prisma.booking.findFirst({ where: { jobId: job.id } });
      if (bk) {
        await prisma.booking.update({ where: { id: bk.id }, data: { status: 'completed' } });
      }
    }
    res.json({ success: true, data: shapeJob(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/rides/:id/reset-allocation', async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ success: false, message: 'Ride not found' }); return; }
    if (!['needs_allocation', 'driver_assigned', 'vehicle_assigned'].includes(job.status)) {
      res.status(409).json({ success: false, message: `Cannot reset allocation in status: ${job.status}` }); return;
    }
    const updated = await prisma.$transaction(async tx => {
      if (job.assignedDriverId) {
        const otherActiveJob = await tx.job.findFirst({
          where: {
            id: { not: job.id },
            assignedDriverId: job.assignedDriverId,
            status: { in: ACTIVE_DRIVER_JOB_STATUSES },
          },
          select: { id: true },
        });
        if (!otherActiveJob) {
          await tx.driver.update({ where: { id: job.assignedDriverId }, data: { status: 'available', assignedVehicleId: null } });
        }
      }
      if (job.assignedVehicleId) {
        await tx.fleetVehicle.update({ where: { id: job.assignedVehicleId }, data: { status: 'available', assignedDriverId: null } });
      }
      const resetJob = await tx.job.update({
        where: { id: job.id },
        data: { assignedDriverId: null, assignedVehicleId: null, status: job.affiliateId ? 'needs_allocation' : 'awaiting_affiliate' },
      });
      await tx.rideStatusHistory.create({
        data: {
          jobId: job.id,
          fromStatus: job.status,
          toStatus: resetJob.status,
          changedBy: req.user?.id ?? 'ops',
          changedByRole: req.user?.role ?? 'ops',
          notes: 'Allocation reset by operations',
        },
      });
      await recordRideFlowEvent({
        job: resetJob,
        eventType: 'allocation_reset',
        title: 'Allocation reset',
        description: 'Driver and vehicle were released by operations',
        fromStatus: job.status,
        toStatus: resetJob.status,
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ?? 'ops',
        driverId: job.assignedDriverId,
        vehicleId: job.assignedVehicleId,
      }, tx);
      return resetJob;
    });
    res.json({ success: true, message: 'Allocation reset', data: shapeJob(updated) });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/ops/rides/{id}/assign-affiliate:
 *   put:
 *     summary: Assign an affiliate to a ride
 *     tags: [Operations]
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
 *               affiliateId: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/rides/:id/assign-affiliate', async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ success: false, message: 'Ride not found' }); return; }
    const { affiliateId } = req.body as { affiliateId: string };
    const aff = await prisma.affiliate.findFirst({ where: { id: affiliateId, isApproved: true } });
    if (!aff) { res.status(404).json({ success: false, message: 'Affiliate not found or not approved' }); return; }
    const updated = await prisma.$transaction(async tx => {
      const claimed = await tx.job.updateMany({
        where: { id: job.id, status: 'awaiting_affiliate', affiliateId: null, assignedDriverId: null },
        data: { affiliateId, status: 'needs_allocation' },
      });
      if (claimed.count !== 1) throw new Error('RIDE_ALREADY_CLAIMED');
      await tx.rideOffer.updateMany({
        where: { jobId: job.id, status: 'pending' },
        data: { status: 'withdrawn', respondedAt: new Date() },
      });
      const updatedJob = await tx.job.findUniqueOrThrow({ where: { id: job.id } });
      await recordRideFlowEvent({
        job: updatedJob,
        eventType: 'affiliate_assigned',
        title: 'Affiliate assigned',
        description: aff.companyName,
        fromStatus: job.status,
        toStatus: 'needs_allocation',
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ?? 'ops',
        affiliateId,
      }, tx);
      return updatedJob;
    });
    await pushNotification(affiliateId, 'affiliate', 'Job Assigned', `Job ${job.bookingRef} has been assigned to you. Please allocate driver and vehicle.`, 'job');
    res.json({ success: true, data: shapeJob(updated) });
  } catch (e) {
    if (e instanceof Error && e.message === 'RIDE_ALREADY_CLAIMED') {
      res.status(409).json({ success: false, message: 'This ride has already been claimed' });
      return;
    }
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Operational Fleet Vehicles ───────────────────────────────────────────────

/**
 * @swagger
 * /api/ops/vehicles:
 *   get:
 *     summary: List all operational fleet vehicles
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Fleet vehicles }
 */
router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const { ownerType } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (ownerType === 'independent') where.ownerDriverId = { not: null };
    else if (ownerType === 'affiliate') where.affiliateId = { not: null };

    const vehicles = await prisma.fleetVehicle.findMany({ where, include: { documents: true } });
    await Promise.all(vehicles.map(vehicle => syncVehicleDocumentExpiries(vehicle.id)));
    const refreshed = await prisma.fleetVehicle.findMany({ where, include: { documents: true } });
    const enriched = await Promise.all(refreshed.map(async v => {
      const ownerDriver = v.ownerDriverId
        ? await prisma.driver.findUnique({ where: { id: v.ownerDriverId }, select: { id: true, fullName: true, email: true, phone: true } })
        : null;
      const ownerAffiliate = v.affiliateId
        ? await prisma.affiliate.findUnique({ where: { id: v.affiliateId }, select: { id: true, tradingName: true, companyName: true } })
        : null;
      return { ...v, ownerDriver, ownerAffiliate };
    }));
    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/ops/vehicles:
 *   post:
 *     summary: Add an operational vehicle to the fleet
 *     tags: [Operations]
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
 *               vehicleType:       { type: string, enum: [Saloon, Estate, MPV, Executive, Minibus, Coach, Luxury] }
 *               vehicleCategory:   { type: string, enum: [prestige, minibus, coaches, taxi] }
 *               colour:            { type: string }
 *               passengerCapacity: { type: number }
 *               luggageCapacity:   { type: number }
 *               motExpiry:         { type: string }
 *               insuranceExpiry:   { type: string }
 *               phvLicenceExpiry:  { type: string }
 *               affiliateId:       { type: string }
 *     responses:
 *       201: { description: Vehicle added }
 */
router.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const { id: _id, status: _s, ...b } = req.body;
    const v = await prisma.fleetVehicle.create({ data: { id: `fv-${uuid()}`, status: 'available', ...b } });
    await syncVehicleDocumentExpiries(v.id);
    res.status(201).json({ success: true, data: v });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/ops/vehicles/{id}:
 *   put:
 *     summary: Update an operational vehicle
 *     tags: [Operations]
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
    const exists = await prisma.fleetVehicle.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
    const { id: _id, ...data } = req.body;
    const v = await prisma.fleetVehicle.update({ where: { id: req.params.id }, data });
    await syncVehicleDocumentExpiries(v.id);
    res.json({ success: true, data: v });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/vehicles/:id/approve', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.fleetVehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }
    const { override } = req.body as { override?: boolean };
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
    const { override } = req.body as { override?: boolean };
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

router.put('/vehicles/:id/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body as { reason?: string };
    const vehicle = await prisma.fleetVehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }
    const updated = await prisma.fleetVehicle.update({
      where: { id: vehicle.id },
      data: {
        isApproved: false,
        approvalStatus: 'rejected',
        rejectionReason: reason || 'Vehicle compliance was not approved',
        status: 'offline',
      },
    });
    if (updated.ownerDriverId) {
      await prisma.driver.update({ where: { id: updated.ownerDriverId }, data: { status: 'offline' } });
      await pushNotification(updated.ownerDriverId, 'driver', 'Vehicle Requires Attention', updated.rejectionReason || 'Vehicle rejected', 'document');
    }
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Affiliates ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ops/affiliates:
 *   get:
 *     summary: List affiliates (ops view)
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Affiliates }
 */
router.get('/affiliates', async (_req: Request, res: Response) => {
  try {
    const affiliates = await prisma.affiliate.findMany();
    const list = await Promise.all(affiliates.map(async ({ passwordHash: _, ...a }) => ({
      ...a,
      driverCount:  await prisma.driver.count({ where: { affiliateId: a.id } }),
      vehicleCount: await prisma.fleetVehicle.count({ where: { affiliateId: a.id } }),
      totalJobs:    await prisma.job.count({ where: { affiliateId: a.id } }),
    })));
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/ops/affiliates/{id}:
 *   get:
 *     summary: Get affiliate detail with their drivers and vehicles
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Affiliate detail }
 */
router.get('/affiliates/:id', async (req: Request, res: Response) => {
  try {
    const a = await prisma.affiliate.findUnique({ where: { id: req.params.id } });
    if (!a) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
    const { passwordHash: _, ...safe } = a;
    const documents = await ensureAffiliateDocuments(a.id);
    const [affDrivers, affVehicles, affJobs] = await Promise.all([
      prisma.driver.findMany({ where: { affiliateId: a.id }, include: { documents: true } }),
      prisma.fleetVehicle.findMany({ where: { affiliateId: a.id } }),
      prisma.job.findMany({ where: { affiliateId: a.id } }),
    ]);
    res.json({
      success: true,
      data: safe,
      drivers: affDrivers.map(({ passwordHash: _p, ...d }) => d),
      vehicles: affVehicles,
      jobs: affJobs.map(shapeJob),
      documents,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/affiliates/:id/approve', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.affiliate.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
    const a = await prisma.affiliate.update({ where: { id: req.params.id }, data: { isApproved: true } });
    const { passwordHash: _, ...safe } = a;
    res.json({ success: true, message: 'Affiliate approved', data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/affiliates/:id/suspend', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.affiliate.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
    const a = await prisma.affiliate.update({ where: { id: req.params.id }, data: { isApproved: false } });
    const { passwordHash: _, ...safe } = a;
    res.json({ success: true, message: 'Affiliate suspended', data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Drivers ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ops/drivers:
 *   get:
 *     summary: List all drivers (ops view)
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Drivers }
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
    const { override } = req.body as { override?: boolean };
    if (!override && !hasCurrentDocumentFile(document)) {
      res.status(409).json({ success: false, message: 'A current uploaded document is required before approval' });
      return;
    }
    const updated = await prisma.affiliateDocument.update({
      where: { id: document.id },
      data: { status: 'approved', rejectionReason: null },
    });
    await pushNotification(req.params.affiliateId, 'affiliate', 'Document Approved', `${document.label} has been approved.`, 'document');
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
    await pushNotification(req.params.affiliateId, 'affiliate', 'Document Requires Attention', updated.rejectionReason || 'Document rejected', 'document');
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.get('/drivers', async (_req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        documents: true,
        affiliate: { select: { id: true, companyName: true } },
      },
      orderBy: { joinedDate: 'desc' },
    });
    await Promise.all(drivers.map(driver => ensureDriverDocuments(driver.id)));
    const refreshed = await prisma.driver.findMany({
      include: {
        documents: true,
        affiliate: { select: { id: true, companyName: true } },
      },
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
 * /api/ops/drivers/{id}:
 *   get:
 *     summary: Get driver detail
 *     tags: [Operations]
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
      include: {
        documents: true,
        affiliate: { select: { id: true, companyName: true } },
      },
    });
    if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    await ensureDriverDocuments(d.id);
    const refreshed = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: {
        documents: true,
        affiliate: { select: { id: true, companyName: true } },
      },
    });
    if (!refreshed) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const { passwordHash: _, ...safe } = refreshed;
    const [driverJobs, driverEarnings] = await Promise.all([
      prisma.job.findMany({ where: { assignedDriverId: d.id } }),
      prisma.earningEntry.findMany({ where: { entityId: d.id } }),
    ]);
    const vehicles = await prisma.fleetVehicle.findMany({ where: { ownerDriverId: d.id } });
    res.json({
      success: true,
      data: safe,
      jobs: driverJobs.map(shapeJob),
      earnings: driverEarnings.map(e => ({ ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() })),
      vehicles,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/drivers/:id/approve', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const { override } = req.body as { override?: boolean };
    if (override) {
      await ensureDriverDocuments(req.params.id);
      await prisma.driverDocument.updateMany({
        where: { driverId: req.params.id, status: { not: 'approved' } },
        data: { status: 'approved', rejectionReason: null },
      });
    }
    const d = await prisma.driver.update({
      where: { id: req.params.id },
      data: { isApproved: true, applicationStatus: 'approved', status: 'offline', documentsStatus: override ? 'approved' : exists.documentsStatus },
      include: { documents: true, affiliate: { select: { id: true, companyName: true } } },
    });
    const { passwordHash: _, ...safe } = d;
    res.json({ success: true, message: 'Driver approved', data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/drivers/:driverId/documents/:documentId/approve', async (req: Request, res: Response) => {
  try {
    const document = await prisma.driverDocument.findFirst({
      where: { id: req.params.documentId, driverId: req.params.driverId },
    });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const { override } = req.body as { override?: boolean };
    if (!override && !hasCurrentDocumentFile(document)) {
      res.status(409).json({ success: false, message: 'A current uploaded document is required before approval' });
      return;
    }
    await prisma.driverDocument.update({
      where: { id: document.id },
      data: { status: 'approved', rejectionReason: null },
    });
    const documents = await prisma.driverDocument.findMany({ where: { driverId: req.params.driverId } });
    const allApproved = documents.every(item => item.status === 'approved');
    await prisma.driver.update({
      where: { id: req.params.driverId },
      data: { documentsStatus: allApproved ? 'approved' : 'pending', status: 'offline' },
    });
    await pushNotification(req.params.driverId, 'driver', 'Document Approved', `${document.label} has been approved.`, 'document');
    res.json({ success: true, message: 'Document approved', allApproved });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/drivers/:driverId/documents/:documentId/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body as { reason?: string };
    const document = await prisma.driverDocument.findFirst({
      where: { id: req.params.documentId, driverId: req.params.driverId },
    });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    await prisma.driverDocument.update({
      where: { id: document.id },
      data: { status: 'rejected', rejectionReason: reason || 'Document was not approved' },
    });
    await prisma.driver.update({
      where: { id: req.params.driverId },
      data: { documentsStatus: 'rejected', status: 'offline' },
    });
    await pushNotification(req.params.driverId, 'driver', 'Document Requires Attention', reason || `${document.label} was rejected.`, 'document');
    res.json({ success: true, message: 'Document rejected' });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

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
    res.json({ success: true, message: 'Driver application rejected', data: safe });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Customers ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ops/customers:
 *   get:
 *     summary: List all customers (ops view)
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Customers }
 */
router.get('/customers', async (_req: Request, res: Response) => {
  try {
    const [customers, jobs] = await Promise.all([
      prisma.customer.findMany(),
      prisma.job.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);
    const customerByEmail = new Map(customers.map(customer => [customer.email.toLowerCase(), customer]));
    const jobGroups = new Map<string, typeof jobs>();
    for (const job of jobs) {
      const key = job.customerEmail?.toLowerCase() || `phone:${job.customerPhone}`;
      jobGroups.set(key, [...(jobGroups.get(key) ?? []), job]);
    }

    const list = Array.from(jobGroups.entries()).map(([key, customerJobs]) => {
      const latest = customerJobs[0];
      const registered = latest.customerEmail ? customerByEmail.get(latest.customerEmail.toLowerCase()) : undefined;
      const ratings = customerJobs.map(job => job.driverRating).filter((rating): rating is number => rating !== null);
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
        } as { bookingRef: string; status: string; dateTime: string } | null,
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
    list.sort((a, b) => new Date(b.latestRide?.dateTime ?? b.createdAt).getTime() - new Date(a.latestRide?.dateTime ?? a.createdAt).getTime());
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Earnings ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ops/earnings:
 *   get:
 *     summary: All earnings records
 *     tags: [Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Earnings }
 */
router.get('/earnings', async (_req: Request, res: Response) => {
  try {
    const earnings = await prisma.earningEntry.findMany({ orderBy: { date: 'desc' } });
    const shaped = earnings.map(e => ({ ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() }));
    const totalPaid    = shaped.filter(e => e.status === 'paid').reduce((s, e) => s + e.netAmount, 0);
    const totalPending = shaped.filter(e => e.status === 'pending').reduce((s, e) => s + e.netAmount, 0);
    res.json({ success: true, data: shaped, summary: { totalPaid, totalPending, count: shaped.length } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/ops/earnings/{id}/pay:
 *   put:
 *     summary: Mark an earning as paid
 *     tags: [Operations]
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
router.put('/earnings/:id/pay', async (req: Request, res: Response) => {
  try {
    const exists = await prisma.earningEntry.findUnique({ where: { id: req.params.id } });
    if (!exists) { res.status(404).json({ success: false, message: 'Earning not found' }); return; }
    const e = await prisma.earningEntry.update({ where: { id: req.params.id }, data: { status: 'paid' } });
    res.json({ success: true, data: { ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

export default router;
