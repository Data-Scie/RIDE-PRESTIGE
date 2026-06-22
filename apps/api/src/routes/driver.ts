import { Router, Request, Response, RequestHandler } from 'express';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db';
import { recordRideFlowEvent } from '../lib/rideFlow';
import { storeDocumentFile, validateDocumentFile } from '../lib/documentUpload';
import {
  ensureVehicleDocuments,
  isDocumentUrl as isVehicleDocumentUrl,
  syncVehicleDocumentExpiries,
} from '../lib/vehicleDocuments';
import { ensureDriverDocuments } from '../lib/driverDocuments';
import { pushNotification } from '../services/notificationService';
import { emitToRoom } from '../lib/socket';
import {
  claimIndependentRide,
  createIndependentRideOffers,
  expireRideOffers,
  isDriverDocumentEligible,
} from '../services/dispatchService';
import type { JobStatus, Stop } from '../types';

const router = Router();
router.use(authenticate, requireRole('driver', 'admin', 'ops', 'affiliate'));
const documentUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const uploadSingleDocument = documentUpload.single('document') as unknown as RequestHandler;

const getDrvId = (req: Request): string => req.user!.id;
const ACTIVE_JOB_STATUSES = ['driver_assigned', 'vehicle_assigned', 'driver_accepted', 'on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress'];
const ACTIVE_JOB_PRIORITY: Record<string, number> = {
  in_progress: 0,
  passenger_onboard: 1,
  arrived_pickup: 2,
  on_route: 3,
  driver_accepted: 4,
  vehicle_assigned: 5,
  driver_assigned: 6,
};

function isDocumentUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
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
  // yourEarnings: independent drivers (no affiliateId on job) earn affiliatePayoutAmount.
  // Fleet drivers (job has affiliateId) are paid by their affiliate — RP does not set that rate.
  const yourEarnings = j.affiliateId === null ? j.affiliatePayoutAmount : null;
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
    status: j.status,
    assignedDriverId: j.assignedDriverId, assignedVehicleId: j.assignedVehicleId,
    completedAt: j.completedAt?.toISOString() ?? null,
    customerRating: j.customerRating, customerFeedback: j.customerFeedback, driverRating: j.driverRating,
    createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString(),
    // Earnings visibility: independent drivers see their payout; fleet drivers see null (affiliate sets their rate)
    yourEarnings,
  };
}

function pickCurrentJob<T extends { status: string; dateTime: Date; updatedAt: Date }>(jobs: T[]): T | undefined {
  return [...jobs].sort((a, b) => {
    const priority = (ACTIVE_JOB_PRIORITY[a.status] ?? 99) - (ACTIVE_JOB_PRIORITY[b.status] ?? 99);
    if (priority !== 0) return priority;
    return Math.max(b.dateTime.getTime(), b.updatedAt.getTime()) - Math.max(a.dateTime.getTime(), a.updatedAt.getTime());
  })[0];
}

function canManageIndependentVehicle(driver: { driverType: string; isApproved: boolean; applicationStatus: string }): boolean {
  return driver.driverType === 'independentDriver'
    && driver.isApproved
    && driver.applicationStatus === 'approved';
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/driver/dashboard:
 *   get:
 *     summary: Driver dashboard
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Dashboard stats }
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const driver = await prisma.driver.findUnique({ where: { id: drvId } });
    if (!driver) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const [myJobs, myEarnings] = await Promise.all([
      prisma.job.findMany({ where: { assignedDriverId: drvId }, orderBy: { dateTime: 'desc' } }),
      driver.driverType === 'independentDriver'
        ? prisma.earningEntry.findMany({ where: { entityId: drvId, entityType: 'driver' } })
        : Promise.resolve([]),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const currentJob = pickCurrentJob(myJobs.filter(j => ACTIVE_JOB_STATUSES.includes(j.status)));
    const currentVehicle = currentJob?.assignedVehicleId
      ? await prisma.fleetVehicle.findUnique({ where: { id: currentJob.assignedVehicleId } })
      : null;
    res.json({
      success: true,
      data: {
        status:          driver.status,
        rating:          driver.rating,
        totalJobs:       driver.totalJobs,
        documentsStatus: driver.documentsStatus,
        currentJob:      currentJob ? shapeJob(currentJob) : null,
        currentRideId:   currentJob?.id ?? null,
        currentVehicle,
        todayJobs:       myJobs.filter(j => j.dateTime.toISOString().startsWith(today)).length,
        completedJobs:   myJobs.filter(j => j.status === 'completed').length,
        todayEarnings:   parseFloat(myEarnings.filter(e => e.date.toISOString().startsWith(today)).reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
        totalEarnings:   parseFloat(myEarnings.reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
        pendingPayout:   parseFloat(myEarnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Available Jobs (independent drivers) ─────────────────────────────────────

/**
 * @swagger
 * /api/driver/jobs/available:
 *   get:
 *     summary: Jobs available to an independent driver
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Available jobs }
 */
router.get('/jobs/available', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const driver = await prisma.driver.findUnique({ where: { id: drvId } });
    if (!driver || driver.driverType !== 'independentDriver') {
      res.status(403).json({ success: false, message: 'Only independent drivers can view open jobs' }); return;
    }
    if (!driver.isApproved || driver.applicationStatus !== 'approved' || driver.status !== 'available') {
      res.json({ success: true, data: [], total: 0 });
      return;
    }
    await expireRideOffers();
    const offers = await prisma.rideOffer.findMany({
      where: { driverId: drvId, status: 'pending', expiresAt: { gt: new Date() } },
      include: { job: true },
      orderBy: { expiresAt: 'asc' },
    });
    const list = offers.map(offer => ({
      ...shapeJob(offer.job),
      id: offer.id,
      jobId: offer.jobId,
      offerId: offer.id,
      offerStatus: offer.status,
      expiresAt: offer.expiresAt.toISOString(),
      vehicleId: offer.vehicleId,
    }));
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/driver/jobs/my:
 *   get:
 *     summary: Get all jobs assigned to this driver
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: My jobs }
 */
router.get('/jobs/my', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const jobs = await prisma.job.findMany({
      where: { assignedDriverId: drvId },
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
 * /api/driver/jobs/current:
 *   get:
 *     summary: Get current active job for driver
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Current job or null }
 */
router.get('/jobs/current', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const currentJobs = await prisma.job.findMany({
      where: {
        assignedDriverId: drvId,
        status: { in: ACTIVE_JOB_STATUSES },
      },
      orderBy: { dateTime: 'desc' },
    });
    const selected = pickCurrentJob(currentJobs);
    const vehicle = selected?.assignedVehicleId
      ? await prisma.fleetVehicle.findUnique({ where: { id: selected.assignedVehicleId } })
      : null;
    res.json({ success: true, data: selected ? { ...shapeJob(selected), vehicle } : null });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/driver/jobs/history:
 *   get:
 *     summary: Completed jobs history
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: History }
 */
router.get('/jobs/history', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const jobs = await prisma.job.findMany({
      where: { assignedDriverId: drvId, status: { in: ['completed', 'cancelled'] } },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
    const list = jobs.map(shapeJob);
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/driver/jobs/{id}:
 *   get:
 *     summary: Get job detail
 *     tags: [Driver]
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
    const drvId = getDrvId(req);
    const job = await prisma.job.findFirst({ where: { id: req.params.id, assignedDriverId: drvId } });
    if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
    const vehicle = job.assignedVehicleId
      ? await prisma.fleetVehicle.findUnique({ where: { id: job.assignedVehicleId } })
      : null;
    res.json({ success: true, data: shapeJob(job), vehicle: vehicle ?? null });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/driver/jobs/{id}/accept:
 *   post:
 *     summary: Driver accepts a job
 *     tags: [Driver]
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
    const drvId = getDrvId(req);
    const job = await prisma.job.findFirst({ where: { id: req.params.id, assignedDriverId: drvId } });
    if (!job) { res.status(404).json({ success: false, message: 'Job not found or not assigned to you' }); return; }
    if (!['driver_assigned', 'vehicle_assigned'].includes(job.status)) {
      res.status(409).json({ success: false, message: `Cannot accept job in status: ${job.status}` }); return;
    }
    if (job.affiliateId && !job.assignedVehicleId) {
      res.status(409).json({ success: false, message: 'A vehicle must be assigned before the driver can accept this job' }); return;
    }
    const updated = await prisma.$transaction(async tx => {
      const updatedJob = await tx.job.update({ where: { id: job.id }, data: { status: 'driver_accepted' } });
      await tx.driver.update({ where: { id: drvId }, data: { status: 'busy' } });
      await tx.booking.updateMany({
        where: { OR: [{ id: job.bookingId ?? '' }, { jobId: job.id }] },
        data: { status: 'accepted' },
      });
      await tx.rideStatusHistory.create({
        data: { jobId: job.id, fromStatus: job.status, toStatus: 'driver_accepted', changedBy: drvId, changedByRole: 'driver' },
      });
      await recordRideFlowEvent({
        job: updatedJob,
        eventType: 'driver_accepted_assignment',
        title: 'Driver accepted assignment',
        fromStatus: job.status,
        toStatus: 'driver_accepted',
        actorId: drvId,
        actorRole: 'driver',
        driverId: drvId,
        vehicleId: job.assignedVehicleId,
      }, tx);
      return updatedJob;
    });
    res.json({ success: true, message: 'Job accepted', data: shapeJob(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/driver/jobs/{id}/status:
 *   put:
 *     summary: Update ride status (driver app ride flow)
 *     tags: [Driver]
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
 *               status: { type: string, enum: [on_route, arrived_pickup, passenger_onboard, in_progress, completed, cancelled] }
 *     responses:
 *       200: { description: Status updated }
 */
router.post('/jobs/:id/claim', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const updated = await claimIndependentRide(drvId, req.params.id);
    res.json({ success: true, message: 'Job claimed', data: shapeJob(updated) });
  } catch (e) {
    const reason = e instanceof Error ? e.message : '';
    if (['OFFER_UNAVAILABLE', 'RIDE_ALREADY_CLAIMED'].includes(reason)) {
      res.status(409).json({ success: false, message: 'This ride offer is no longer available' });
      return;
    }
    if (['DRIVER_INELIGIBLE', 'VEHICLE_INELIGIBLE', 'OUTSIDE_SERVICE_AREA'].includes(reason)) {
      res.status(403).json({ success: false, message: reason.replace(/_/g, ' ').toLowerCase() });
      return;
    }
    console.error('Independent ride claim failed:', e);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/jobs/:id/decline', async (req: Request, res: Response) => {
  try {
    const result = await prisma.rideOffer.updateMany({
      where: { id: req.params.id, driverId: getDrvId(req), status: 'pending' },
      data: { status: 'declined', respondedAt: new Date() },
    });
    if (result.count !== 1) {
      res.status(409).json({ success: false, message: 'This ride offer is no longer available' });
      return;
    }
    res.json({ success: true, message: 'Ride offer declined' });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.put('/jobs/:id/status', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const job = await prisma.job.findFirst({ where: { id: req.params.id, assignedDriverId: drvId } });
    if (!job) { res.status(404).json({ success: false, message: 'Job not found or not assigned to you' }); return; }
    const { status } = req.body as { status: JobStatus };
    const allowed: JobStatus[] = ['on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status: ${status}` }); return;
    }
    const nextStatus: Partial<Record<JobStatus, JobStatus[]>> = {
      driver_accepted: ['on_route', 'cancelled'],
      on_route: ['arrived_pickup', 'cancelled'],
      arrived_pickup: ['passenger_onboard', 'cancelled'],
      passenger_onboard: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
    };
    if (!(nextStatus[job.status as JobStatus] ?? []).includes(status)) {
      res.status(409).json({ success: false, message: `Cannot move ride from ${job.status} to ${status}` }); return;
    }

    if (status === 'completed') {
      const now = new Date();
      const updated = await prisma.$transaction(async tx => {
        const updatedJob = await tx.job.update({
          where: { id: job.id },
          data: { status: 'completed', completedAt: now },
        });
        await tx.rideStatusHistory.create({ data: { jobId: job.id, fromStatus: job.status, toStatus: status, changedBy: drvId, changedByRole: 'driver' } });
        await recordRideFlowEvent({
          job: updatedJob,
          eventType: 'status_changed',
          title: 'Ride completed',
          fromStatus: job.status,
          toStatus: status,
          actorId: drvId,
          actorRole: 'driver',
          driverId: drvId,
          vehicleId: job.assignedVehicleId,
        }, tx);
        // Earning amount for this driver:
        // - Independent driver (no affiliateId on job): earns the full operator payout (affiliatePayoutAmount)
        // - Fleet driver (job has affiliateId): their pay is set by their affiliate, not by RP; record 0 from RP
        const isIndependentJob = !job.affiliateId;
        const driverEarn = isIndependentJob ? job.affiliatePayoutAmount : 0;
        await tx.driver.update({
          where: { id: drvId },
          data: { status: 'available', totalJobs: { increment: 1 }, totalEarnings: { increment: driverEarn } },
        });
        if (job.assignedVehicleId) {
          await tx.fleetVehicle.update({ where: { id: job.assignedVehicleId }, data: { status: 'available' } });
        }
        if (isIndependentJob) {
          // Independent driver gets the payout recorded by RP
          await tx.earningEntry.create({
            data: {
              id: `earn-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
              entityId: drvId, entityType: 'driver',
              date: now, grossAmount: job.affiliatePayoutAmount,
              commissionDeducted: 0, netAmount: job.affiliatePayoutAmount, status: 'pending',
            },
          });
        } else {
          // Fleet driver job: affiliate earns the payout; fleet driver pay is handled by the affiliate
          await tx.earningEntry.create({
            data: {
              id: `earn-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
              entityId: job.affiliateId!, entityType: 'affiliate',
              date: now, grossAmount: job.affiliatePayoutAmount,
              commissionDeducted: 0, netAmount: job.affiliatePayoutAmount, status: 'pending',
            },
          });
        }
        await tx.payment.create({
          data: {
            id: `pay-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
            customerId: job.customerId, customerName: job.customerName,
            amount: job.fareAmount, method: 'cash', status: 'paid', paidAt: now,
          },
        });
        await tx.booking.updateMany({
          where: { OR: [{ id: job.bookingId ?? '' }, { jobId: job.id }] },
          data: { status: 'completed' },
        });
        return updatedJob;
      });
      if (job.affiliateId) {
        await pushNotification(job.affiliateId, 'affiliate', 'Ride Completed', `Job ${job.bookingRef} completed. Earnings added to your account.`, 'earnings');
      }
      if (job.customerId) {
        await pushNotification(job.customerId, 'customer', 'Ride Complete', `Your ride (${job.bookingRef}) is complete. Please rate your experience!`, 'booking');
      }
      res.json({ success: true, data: shapeJob(updated) });
    } else {
      const updated = await prisma.$transaction(async tx => {
        const updatedJob = await tx.job.update({ where: { id: job.id }, data: { status } });
        await tx.rideStatusHistory.create({ data: { jobId: job.id, fromStatus: job.status, toStatus: status, changedBy: drvId, changedByRole: 'driver' } });
        await recordRideFlowEvent({
          job: updatedJob,
          eventType: status === 'cancelled' ? 'ride_cancelled' : 'status_changed',
          title: status === 'cancelled' ? 'Ride cancelled' : `Ride moved to ${status.replace(/_/g, ' ')}`,
          fromStatus: job.status,
          toStatus: status,
          actorId: drvId,
          actorRole: 'driver',
          driverId: drvId,
          vehicleId: job.assignedVehicleId,
        }, tx);
        if (status === 'cancelled') {
          await tx.driver.update({ where: { id: drvId }, data: { status: 'available' } });
          if (job.assignedVehicleId) {
            await tx.fleetVehicle.update({ where: { id: job.assignedVehicleId }, data: { status: 'available' } });
          }
          await tx.booking.updateMany({
            where: { OR: [{ id: job.bookingId ?? '' }, { jobId: job.id }] },
            data: { status: 'cancelled' },
          });
        } else {
          await tx.booking.updateMany({
            where: { OR: [{ id: job.bookingId ?? '' }, { jobId: job.id }] },
            data: { status: 'in_progress' },
          });
        }
        return updatedJob;
      });
      res.json({ success: true, data: shapeJob(updated) });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Status toggle ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/driver/status:
 *   put:
 *     summary: Set driver availability status
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [available, busy, offline] }
 *     responses:
 *       200: { description: Status updated }
 */
router.put('/status', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const { status } = req.body as { status: 'available' | 'busy' | 'offline' };
    const driver = await prisma.driver.findUnique({ where: { id: drvId } });
    if (!driver) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    if (!['available', 'busy', 'offline'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid driver status' });
      return;
    }
    if (status === 'available') {
      const documents = await prisma.driverDocument.findMany({ where: { driverId: drvId } });
      if (!driver.isApproved || driver.applicationStatus !== 'approved') {
        res.status(403).json({ success: false, message: 'Your driver account is not approved' });
        return;
      }
      if (driver.documentsStatus !== 'approved' || !isDriverDocumentEligible(documents)) {
        res.status(403).json({ success: false, message: 'All required driver documents must be approved and current' });
        return;
      }
      if (driver.driverType === 'independentDriver') {
        const vehicles = await prisma.fleetVehicle.findMany({ where: { ownerDriverId: drvId } });
        const isCurrent = (value: string) => {
          const expiry = new Date(`${value}T23:59:59.999Z`);
          return !Number.isNaN(expiry.getTime()) && expiry.getTime() >= Date.now();
        };
        const hasApprovedVehicle = vehicles.some(vehicle =>
          vehicle.isApproved
          && vehicle.approvalStatus === 'approved'
          && vehicle.status === 'available'
          && isCurrent(vehicle.motExpiry)
          && isCurrent(vehicle.insuranceExpiry)
          && isCurrent(vehicle.phvLicenceExpiry));
        if (!hasApprovedVehicle) {
          res.status(403).json({ success: false, message: 'An approved, compliant vehicle is required before going online' });
          return;
        }
      }
    }
    await prisma.driver.update({ where: { id: drvId }, data: { status } });
    if (status === 'available' && driver.driverType === 'independentDriver') {
      const openJobs = await prisma.job.findMany({
        where: { status: 'awaiting_affiliate', affiliateId: null, assignedDriverId: null },
        select: { id: true },
      });
      await Promise.all(openJobs.map(job => createIndependentRideOffers(job.id)));
    }
    res.json({ success: true, message: `Status set to ${status}`, status });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: getDrvId(req) } });
    if (!driver || driver.driverType !== 'independentDriver') {
      res.status(403).json({ success: false, message: 'Vehicle management is for independent drivers' });
      return;
    }
    const vehicles = await prisma.fleetVehicle.findMany({
      where: { ownerDriverId: driver.id },
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
    });
    await Promise.all(vehicles.map(vehicle => syncVehicleDocumentExpiries(vehicle.id)));
    const refreshed = await prisma.fleetVehicle.findMany({
      where: { ownerDriverId: driver.id },
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: refreshed });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: getDrvId(req) } });
    if (!driver || driver.driverType !== 'independentDriver') {
      res.status(403).json({ success: false, message: 'Only independent drivers can register vehicles' });
      return;
    }
    if (!canManageIndependentVehicle(driver)) {
      res.status(403).json({ success: false, message: 'Your independent driver application must be approved before registering a vehicle' });
      return;
    }
    const {
      make, model, year, registration, vehicleType, vehicleCategory, colour,
      passengerCapacity, luggageCapacity, motExpiry, insuranceExpiry, phvLicenceExpiry,
    } = req.body;
    const validCategories = ['prestige', 'minibus', 'coaches', 'taxi'];
    const expiryValues = [motExpiry, insuranceExpiry, phvLicenceExpiry];
    if (!make || !model || !year || !registration || !vehicleType || !vehicleCategory || !colour
      || !passengerCapacity || luggageCapacity === undefined || !motExpiry || !insuranceExpiry || !phvLicenceExpiry) {
      res.status(400).json({ success: false, message: 'All vehicle and compliance fields are required' });
      return;
    }
    if (!validCategories.includes(vehicleCategory)) {
      res.status(400).json({ success: false, message: 'Invalid vehicle category' });
      return;
    }
    if (expiryValues.some(value => {
      const timestamp = new Date(`${value}T23:59:59.999Z`).getTime();
      return Number.isNaN(timestamp) || timestamp < Date.now();
    })) {
      res.status(400).json({ success: false, message: 'Vehicle compliance dates must be current' });
      return;
    }
    const vehicle = await prisma.fleetVehicle.create({
      data: {
        id: `fv-${uuid()}`,
        make, model, year: Number(year), registration: String(registration).trim().toUpperCase(),
        vehicleType, vehicleCategory, colour,
        passengerCapacity: Number(passengerCapacity), luggageCapacity: Number(luggageCapacity),
        motExpiry, insuranceExpiry, phvLicenceExpiry,
        ownerDriverId: driver.id,
        assignedDriverId: driver.id,
        status: 'offline',
        approvalStatus: 'pending',
        isApproved: false,
      },
    });
    await syncVehicleDocumentExpiries(vehicle.id);
    res.status(201).json({ success: true, data: vehicle });
  } catch (e) {
    res.status(409).json({ success: false, message: 'Vehicle could not be registered; check the registration is unique' });
  }
});

router.put('/vehicles/:vehicleId/documents/:documentId', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const { fileUrl, expiryDate } = req.body as { fileUrl?: string; expiryDate?: string };
    const expiry = expiryDate ? new Date(`${expiryDate}T23:59:59.999Z`) : null;
    if (!fileUrl || !isVehicleDocumentUrl(fileUrl) || !expiryDate || !expiry || expiry.getTime() < Date.now()) {
      res.status(400).json({ success: false, message: 'A document URL and current expiry date are required' });
      return;
    }
    const vehicle = await prisma.fleetVehicle.findFirst({ where: { id: req.params.vehicleId, ownerDriverId: drvId } });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }
    const driver = await prisma.driver.findUnique({ where: { id: drvId } });
    if (!driver || !canManageIndependentVehicle(driver)) {
      res.status(403).json({ success: false, message: 'Your independent driver application must be approved before updating vehicle documents' });
      return;
    }
    await ensureVehicleDocuments(vehicle.id);
    const document = await prisma.vehicleDocument.findFirst({
      where: { id: req.params.documentId, vehicleId: vehicle.id },
    });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const updated = await prisma.vehicleDocument.update({
      where: { id: document.id },
      data: { fileUrl, expiryDate, status: 'pending', uploadedAt: new Date(), rejectionReason: null },
    });
    await prisma.fleetVehicle.update({
      where: { id: vehicle.id },
      data: { approvalStatus: 'pending', isApproved: false, status: 'offline', rejectionReason: null },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/vehicles/:vehicleId/documents/:documentId/upload', uploadSingleDocument, async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
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
    const vehicle = await prisma.fleetVehicle.findFirst({ where: { id: req.params.vehicleId, ownerDriverId: drvId } });
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }
    const driver = await prisma.driver.findUnique({ where: { id: drvId } });
    if (!driver || !canManageIndependentVehicle(driver)) {
      res.status(403).json({ success: false, message: 'Your independent driver application must be approved before updating vehicle documents' });
      return;
    }
    await ensureVehicleDocuments(vehicle.id);
    const document = await prisma.vehicleDocument.findFirst({ where: { id: req.params.documentId, vehicleId: vehicle.id } });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const fileUrl = await storeDocumentFile(req, req.file, vehicle.id, document.type);
    const updated = await prisma.vehicleDocument.update({
      where: { id: document.id },
      data: { fileUrl, expiryDate, status: 'pending', uploadedAt: new Date(), rejectionReason: null },
    });
    await prisma.fleetVehicle.update({
      where: { id: vehicle.id },
      data: { approvalStatus: 'pending', isApproved: false, status: 'offline', rejectionReason: null },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Document upload failed' });
  }
});

router.put('/documents/:id', async (req: Request, res: Response) => {
  try {
    const { fileUrl, expiryDate } = req.body as { fileUrl?: string; expiryDate?: string };
    const expiry = expiryDate ? new Date(`${expiryDate}T23:59:59.999Z`) : null;
    if (!fileUrl || !isDocumentUrl(fileUrl) || !expiryDate || !expiry || expiry.getTime() < Date.now()) {
      res.status(400).json({ success: false, message: 'A document URL and current expiry date are required' });
      return;
    }
    const document = await prisma.driverDocument.findFirst({
      where: { id: req.params.id, driverId: getDrvId(req) },
    });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const updated = await prisma.driverDocument.update({
      where: { id: document.id },
      data: { fileUrl, expiryDate, status: 'pending', uploadedAt: new Date(), rejectionReason: null },
    });
    await prisma.driver.update({
      where: { id: getDrvId(req) },
      data: { documentsStatus: 'pending', status: 'offline' },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/documents/:id/upload', uploadSingleDocument, async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
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
    const document = await prisma.driverDocument.findFirst({
      where: { id: req.params.id, driverId: drvId },
    });
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    const fileUrl = await storeDocumentFile(req, req.file, drvId, document.type);
    const updated = await prisma.driverDocument.update({
      where: { id: document.id },
      data: { fileUrl, expiryDate, status: 'pending', uploadedAt: new Date(), rejectionReason: null },
    });
    await prisma.driver.update({
      where: { id: drvId },
      data: { documentsStatus: 'pending', status: 'offline' },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Document upload failed' });
  }
});

// ─── Earnings ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/driver/earnings:
 *   get:
 *     summary: Get driver earnings
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Earnings }
 */
router.get('/earnings', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const driver = await prisma.driver.findUnique({ where: { id: drvId }, select: { driverType: true } });
    if (!driver || driver.driverType !== 'independentDriver') {
      res.status(403).json({ success: false, message: 'Ride Prestige earnings are only available for independent drivers' });
      return;
    }
    const myEarnings = await prisma.earningEntry.findMany({
      where: { entityId: drvId, entityType: 'driver' },
      orderBy: { date: 'desc' },
    });
    const shaped = myEarnings.map(e => ({ ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() }));
    const today = new Date().toISOString().slice(0, 10);
    const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    res.json({
      success: true,
      data: shaped,
      summary: {
        today:    parseFloat(shaped.filter(e => e.date.startsWith(today)).reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
        thisWeek: parseFloat(shaped.filter(e => e.date >= thisWeekStart.toISOString()).reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
        total:    parseFloat(shaped.reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
        paid:     parseFloat(shaped.filter(e => e.status === 'paid').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
        pending:  parseFloat(shaped.filter(e => e.status === 'pending').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
        jobCount: shaped.length,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/driver/profile:
 *   get:
 *     summary: Get driver profile
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Driver profile }
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const d = await prisma.driver.findUnique({
      where: { id: drvId },
      include: {
        documents: true,
        affiliate: { select: { id: true, companyName: true, tradingName: true } },
      },
    });
    if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const { passwordHash: _, ...safe } = d;
    const assignedVehicle = d.assignedVehicleId
      ? await prisma.fleetVehicle.findUnique({ where: { id: d.assignedVehicleId } })
      : null;
    res.json({ success: true, data: { ...safe, assignedVehicle } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/driver/profile:
 *   put:
 *     summary: Update driver profile
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Updated profile }
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const { fullName, phone, address, city, postcode, serviceAreas } = req.body;
    const d = await prisma.driver.update({
      where: { id: drvId },
      data: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(postcode !== undefined ? { postcode } : {}),
        ...(Array.isArray(serviceAreas)
          ? { serviceAreas: serviceAreas.map(String).map(area => area.trim().toUpperCase()).filter(Boolean) }
          : {}),
      },
      include: { documents: true },
    });
    const { passwordHash: _, ...safe } = d;
    res.json({ success: true, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Documents ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/driver/documents:
 *   get:
 *     summary: Get driver documents
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Documents }
 */
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const d = await prisma.driver.findUnique({ where: { id: drvId } });
    if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    const docs = await ensureDriverDocuments(drvId);
    res.json({ success: true, data: docs, overallStatus: d.documentsStatus });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/driver/notifications:
 *   get:
 *     summary: Get driver notifications
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Notifications }
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const list = await prisma.notification.findMany({
      where: { recipientId: drvId },
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
    const drvId = getDrvId(req);
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, recipientId: drvId },
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
 * /api/driver/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Marked read }
 */
router.put('/notifications/read-all', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    await prisma.notification.updateMany({ where: { recipientId: drvId }, data: { isRead: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Live Location ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/driver/location:
 *   put:
 *     summary: Update driver GPS location (called by mobile app every few seconds)
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:  { type: number, example: 53.3811 }
 *               longitude: { type: number, example: -1.4701 }
 *     responses:
 *       200: { description: Location stored }
 */
router.put('/location', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const { latitude, longitude, speed, heading, accuracy, jobId } = req.body as {
      latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number; jobId?: string;
    };
    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: 'latitude and longitude are required' }); return;
    }
    const now = new Date();
    await prisma.driver.update({
      where: { id: drvId },
      data: { latitude, longitude, lastLocationUpdate: now },
    });
    await prisma.driverLocationHistory.create({
      data: { driverId: drvId, jobId: jobId ?? null, latitude, longitude, speed, heading, accuracy, recordedAt: now },
    });
    const payload = { driverId: drvId, jobId: jobId ?? null, lat: latitude, lng: longitude, speed, heading, updatedAt: now.toISOString() };
    emitToRoom('ops', 'driver:location', payload);
    emitToRoom('admin', 'driver:location', payload);
    if (jobId) emitToRoom(`job:${jobId}`, 'driver:location', payload);
    res.json({ success: true, data: { latitude, longitude, updatedAt: now.toISOString() } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Rate Customer ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/driver/jobs/{id}/rate:
 *   post:
 *     summary: Driver rates the customer after a completed ride
 *     tags: [Driver]
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
 *             required: [rating]
 *             properties:
 *               rating: { type: number, minimum: 1, maximum: 5, example: 5 }
 *     responses:
 *       200: { description: Rating submitted }
 */
router.post('/jobs/:id/rate', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, assignedDriverId: drvId, status: 'completed' },
    });
    if (!job) { res.status(404).json({ success: false, message: 'Completed job not found for this driver' }); return; }
    const { rating } = req.body as { rating: number };
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' }); return;
    }
    await prisma.job.update({ where: { id: job.id }, data: { driverRating: rating } });
    res.json({ success: true, message: 'Rating submitted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Push Token ───────────────────────────────────────────────────────────────

router.put('/push-token', async (req: Request, res: Response) => {
  try {
    const drvId = getDrvId(req);
    const { token } = req.body as { token?: string };
    if (!token) { res.status(400).json({ success: false, message: 'Token required' }); return; }
    await prisma.driver.update({ where: { id: drvId }, data: { expoPushToken: token } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

export default router;
