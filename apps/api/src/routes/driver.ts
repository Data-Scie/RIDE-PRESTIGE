import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db';
import { pushNotification } from '../services/notificationService';
import type { JobStatus, Stop } from '../types';

const router = Router();
router.use(authenticate, requireRole('driver', 'admin', 'ops', 'affiliate'));

const getDrvId = (req: Request): string => req.user!.id;

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
      prisma.job.findMany({ where: { assignedDriverId: drvId } }),
      prisma.earningEntry.findMany({ where: { entityId: drvId, entityType: 'driver' } }),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const currentJob = myJobs.find(j => ['driver_assigned', 'vehicle_assigned', 'driver_accepted', 'on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress'].includes(j.status));
    res.json({
      success: true,
      data: {
        status:          driver.status,
        rating:          driver.rating,
        totalJobs:       driver.totalJobs,
        documentsStatus: driver.documentsStatus,
        currentJob:      currentJob ? shapeJob(currentJob) : null,
        currentRideId:   currentJob?.id ?? null,
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
    const jobs = await prisma.job.findMany({ where: { status: 'awaiting_affiliate', affiliateId: null } });
    const list = jobs.map(shapeJob);
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
    const current = await prisma.job.findFirst({
      where: {
        assignedDriverId: drvId,
        status: { in: ['driver_assigned', 'vehicle_assigned', 'driver_accepted', 'on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress'] },
      },
    });
    res.json({ success: true, data: current ? shapeJob(current) : null });
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
    const driver = await prisma.driver.findUnique({ where: { id: drvId } });
    if (!driver) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
    if (driver.driverType !== 'independentDriver') {
      res.status(403).json({ success: false, message: 'Only independent drivers can claim jobs directly' }); return;
    }
    if (!driver.isApproved) {
      res.status(403).json({ success: false, message: 'Your account must be approved before accepting jobs' }); return;
    }
    const job = await prisma.job.findFirst({ where: { id: req.params.id, status: 'awaiting_affiliate', affiliateId: null } });
    if (!job) { res.status(404).json({ success: false, message: 'Job not available for claiming' }); return; }
    const updated = await prisma.$transaction(async tx => {
      const updatedJob = await tx.job.update({ where: { id: job.id }, data: { assignedDriverId: drvId, status: 'driver_accepted' } });
      await tx.driver.update({ where: { id: drvId }, data: { status: 'busy' } });
      await tx.booking.updateMany({
        where: { OR: [{ id: job.bookingId ?? '' }, { jobId: job.id }] },
        data: { status: 'accepted' },
      });
      await tx.rideStatusHistory.create({
        data: { jobId: job.id, fromStatus: 'awaiting_affiliate', toStatus: 'driver_accepted', changedBy: drvId, changedByRole: 'driver', notes: 'Independent driver claimed job' },
      });
      return updatedJob;
    });
    res.json({ success: true, message: 'Job claimed', data: shapeJob(updated) });
  } catch (e) {
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
        await tx.rideStatusHistory.create({ data: { jobId: job.id, fromStatus: job.status, toStatus: status, changedBy: drvId, changedByRole: 'driver' } });
        const updatedJob = await tx.job.update({
          where: { id: job.id },
          data: { status: 'completed', completedAt: now },
        });
        await tx.driver.update({
          where: { id: drvId },
          data: { status: 'available', totalJobs: { increment: 1 }, totalEarnings: { increment: job.driverPayoutAmount } },
        });
        if (job.assignedVehicleId) {
          await tx.fleetVehicle.update({ where: { id: job.assignedVehicleId }, data: { status: 'available' } });
        }
        await tx.earningEntry.create({
          data: {
            id: `earn-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
            entityId: drvId, entityType: 'driver',
            date: now, grossAmount: job.driverPayoutAmount,
            commissionDeducted: 0, netAmount: job.driverPayoutAmount, status: 'pending',
          },
        });
        if (job.affiliateId) {
          await tx.earningEntry.create({
            data: {
              id: `earn-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
              entityId: job.affiliateId, entityType: 'affiliate',
              date: now, grossAmount: job.affiliatePayoutAmount,
              commissionDeducted: 0, netAmount: job.affiliatePayoutAmount, status: 'pending',
            },
          });
        }
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
        await tx.rideStatusHistory.create({ data: { jobId: job.id, fromStatus: job.status, toStatus: status, changedBy: drvId, changedByRole: 'driver' } });
        const updatedJob = await tx.job.update({ where: { id: job.id }, data: { status } });
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
    await prisma.driver.update({ where: { id: drvId }, data: { status } });
    res.json({ success: true, message: `Status set to ${status}`, status });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
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
    const { passwordHash: _ph, id: _id, isApproved: _ia, totalJobs: _tj, totalEarnings: _te, rating: _r, documents: _docs, ...allowed } = req.body;
    const d = await prisma.driver.update({
      where: { id: drvId },
      data: allowed,
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
    const docs = await prisma.driverDocument.findMany({ where: { driverId: drvId } });
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
    const { latitude, longitude } = req.body as { latitude: number; longitude: number };
    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: 'latitude and longitude are required' }); return;
    }
    const now = new Date();
    await prisma.driver.update({
      where: { id: drvId },
      data: { latitude, longitude, lastLocationUpdate: now },
    });
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

export default router;
