import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate, requireRole } from '../middleware/auth';
import { jobs, drivers, fleetVehicles, earnings, bookings, notifications } from '../data/store';
import { pushNotification } from '../services/notificationService';
import type { JobStatus } from '../types';

const router = Router();
router.use(authenticate, requireRole('driver', 'admin', 'ops', 'affiliate'));

const getDrvId = (req: Request): string => req.user!.id;

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
router.get('/dashboard', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const driver = drivers.find(d => d.id === drvId);
  if (!driver) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  const myJobs     = jobs.filter(j => j.assignedDriverId === drvId);
  const myEarnings = earnings.filter(e => e.entityId === drvId && e.entityType === 'driver');
  const currentJob = myJobs.find(j => ['driver_accepted','on_route','arrived_pickup','passenger_onboard','in_progress'].includes(j.status));
  res.json({
    success: true,
    data: {
      status:           driver.status,
      rating:           driver.rating,
      totalJobs:        driver.totalJobs,
      documentsStatus:  driver.documentsStatus,
      currentJob:       currentJob ?? null,
      todayJobs:        myJobs.filter(j => j.dateTime.startsWith(new Date().toISOString().slice(0,10))).length,
      todayEarnings:    parseFloat(myEarnings.filter(e => e.date.startsWith(new Date().toISOString().slice(0,10))).reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      totalEarnings:    parseFloat(myEarnings.reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      pendingPayout:    parseFloat(myEarnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
    },
  });
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
router.get('/jobs/available', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const driver = drivers.find(d => d.id === drvId);
  if (!driver || driver.driverType !== 'independentDriver') {
    res.status(403).json({ success: false, message: 'Only independent drivers can view open jobs' }); return;
  }
  const available = jobs.filter(j => j.status === 'awaiting_affiliate' && !j.affiliateId);
  res.json({ success: true, data: available, total: available.length });
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
router.get('/jobs/my', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const list = jobs.filter(j => j.assignedDriverId === drvId).sort((a, b) => b.dateTime.localeCompare(a.dateTime));
  res.json({ success: true, data: list, total: list.length });
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
router.get('/jobs/current', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const current = jobs.find(j =>
    j.assignedDriverId === drvId &&
    ['driver_accepted','on_route','arrived_pickup','passenger_onboard','in_progress'].includes(j.status),
  );
  res.json({ success: true, data: current ?? null });
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
router.get('/jobs/history', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const list = jobs
    .filter(j => j.assignedDriverId === drvId && ['completed','cancelled'].includes(j.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json({ success: true, data: list, total: list.length });
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
router.get('/jobs/:id', (req: Request, res: Response) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
  const vehicle = job.assignedVehicleId ? fleetVehicles.find(v => v.id === job.assignedVehicleId) : null;
  res.json({ success: true, data: job, vehicle: vehicle ?? null });
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
router.post('/jobs/:id/accept', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const job = jobs.find(j => j.id === req.params.id && j.assignedDriverId === drvId);
  if (!job) { res.status(404).json({ success: false, message: 'Job not found or not assigned to you' }); return; }
  if (!['driver_assigned','vehicle_assigned'].includes(job.status)) {
    res.status(409).json({ success: false, message: `Cannot accept job in status: ${job.status}` }); return;
  }
  job.status = 'driver_accepted';
  job.updatedAt = new Date().toISOString();
  const acceptingDriver = drivers.find(d => d.id === drvId);
  if (acceptingDriver) acceptingDriver.status = 'busy';
  res.json({ success: true, message: 'Job accepted', data: job });
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
router.put('/jobs/:id/status', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const job = jobs.find(j => j.id === req.params.id && j.assignedDriverId === drvId);
  if (!job) { res.status(404).json({ success: false, message: 'Job not found or not assigned to you' }); return; }
  const { status } = req.body as { status: JobStatus };
  const allowed: JobStatus[] = ['on_route','arrived_pickup','passenger_onboard','in_progress','completed','cancelled'];
  if (!allowed.includes(status)) {
    res.status(400).json({ success: false, message: `Invalid status: ${status}` }); return;
  }
  job.status = status;
  job.updatedAt = new Date().toISOString();

  if (status === 'completed') {
    const now = new Date().toISOString();
    job.completedAt = now;
    const driver = drivers.find(d => d.id === drvId);
    if (driver) { driver.status = 'available'; driver.totalJobs += 1; driver.totalEarnings += job.driverPayoutAmount; }
    const vehicle = job.assignedVehicleId ? fleetVehicles.find(v => v.id === job.assignedVehicleId) : null;
    if (vehicle) vehicle.status = 'available';
    // Create earnings records for driver and affiliate
    earnings.push({
      id: `earn-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
      entityId: drvId, entityType: 'driver',
      date: now, grossAmount: job.driverPayoutAmount,
      commissionDeducted: 0, netAmount: job.driverPayoutAmount, status: 'pending',
    });
    if (job.affiliateId) {
      earnings.push({
        id: `earn-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
        entityId: job.affiliateId, entityType: 'affiliate',
        date: now, grossAmount: job.affiliatePayoutAmount,
        commissionDeducted: 0, netAmount: job.affiliatePayoutAmount, status: 'pending',
      });
      pushNotification(job.affiliateId, 'affiliate', 'Ride Completed', `Job ${job.bookingRef} completed. Earnings added to your account.`, 'earnings');
    }
    // Update linked booking status
    const bk = bookings.find(b => b.jobId === job.id);
    if (bk) { bk.status = 'completed'; bk.updatedAt = now; }
    // Notify customer
    if (job.customerId) {
      pushNotification(job.customerId, 'customer', 'Ride Complete', `Your ride (${job.bookingRef}) is complete. Please rate your experience!`, 'booking');
    }
  }
  res.json({ success: true, data: job });
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
router.put('/status', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const driver = drivers.find(d => d.id === drvId);
  if (!driver) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  const { status } = req.body as { status: 'available' | 'busy' | 'offline' };
  driver.status = status;
  res.json({ success: true, message: `Status set to ${status}`, status });
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
router.get('/earnings', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const myEarnings = earnings.filter(e => e.entityId === drvId && e.entityType === 'driver')
    .sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date().toISOString().slice(0, 10);
  const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  res.json({
    success: true,
    data: myEarnings,
    summary: {
      today:     parseFloat(myEarnings.filter(e => e.date.startsWith(today)).reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      thisWeek:  parseFloat(myEarnings.filter(e => e.date >= thisWeekStart.toISOString()).reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      total:     parseFloat(myEarnings.reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      paid:      parseFloat(myEarnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      pending:   parseFloat(myEarnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      jobCount:  myEarnings.length,
    },
  });
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
router.get('/profile', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const d = drivers.find(x => x.id === drvId);
  if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  const { passwordHash: _, ...safe } = d;
  res.json({ success: true, data: safe });
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
router.put('/profile', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const d = drivers.find(x => x.id === drvId);
  if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  const { passwordHash: _ph, id: _id, isApproved: _ia, totalJobs: _tj, totalEarnings: _te, rating: _r, ...allowed } = req.body as Partial<typeof d>;
  Object.assign(d, allowed);
  const { passwordHash: _, ...safe } = d;
  res.json({ success: true, data: safe });
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
router.get('/documents', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const d = drivers.find(x => x.id === drvId);
  if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  res.json({ success: true, data: d.documents, overallStatus: d.documentsStatus });
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
router.get('/notifications', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const list = notifications.filter(n => n.recipientId === drvId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ success: true, data: list, unread: list.filter(n => !n.isRead).length });
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
router.put('/notifications/read-all', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  notifications.filter(n => n.recipientId === drvId).forEach(n => { n.isRead = true; });
  res.json({ success: true, message: 'All notifications marked as read' });
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
router.put('/location', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const driver = drivers.find(d => d.id === drvId);
  if (!driver) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  const { latitude, longitude } = req.body as { latitude: number; longitude: number };
  if (latitude === undefined || longitude === undefined) {
    res.status(400).json({ success: false, message: 'latitude and longitude are required' }); return;
  }
  driver.latitude = latitude;
  driver.longitude = longitude;
  driver.lastLocationUpdate = new Date().toISOString();
  res.json({ success: true, data: { latitude, longitude, updatedAt: driver.lastLocationUpdate } });
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
router.post('/jobs/:id/rate', (req: Request, res: Response) => {
  const drvId = getDrvId(req);
  const job = jobs.find(j => j.id === req.params.id && j.assignedDriverId === drvId && j.status === 'completed');
  if (!job) { res.status(404).json({ success: false, message: 'Completed job not found for this driver' }); return; }
  const { rating } = req.body as { rating: number };
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' }); return;
  }
  job.driverRating = rating;
  res.json({ success: true, message: 'Rating submitted' });
});

export default router;
