import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { authenticate, requireRole } from '../middleware/auth';
import { jobs, drivers, affiliates, fleetVehicles, earnings, notifications } from '../data/store';
import { pushNotification } from '../services/notificationService';
import type { Driver, FleetVehicle, JobStatus } from '../types';

const router = Router();
router.use(authenticate, requireRole('affiliate', 'admin', 'ops'));

// Helper — get affiliateId from request (either from token or query param for admin)
const getAffId = (req: Request): string => req.user!.affiliateId ?? req.user!.id;

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
router.get('/dashboard', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const myJobs = jobs.filter(j => j.affiliateId === affId);
  const myDrivers  = drivers.filter(d => d.affiliateId === affId);
  const myVehicles = fleetVehicles.filter(v => v.affiliateId === affId);
  const myEarnings = earnings.filter(e => e.entityId === affId && e.entityType === 'affiliate');
  res.json({
    success: true,
    data: {
      newJobs:        jobs.filter(j => j.status === 'awaiting_affiliate').length,
      acceptedJobs:   myJobs.filter(j => !['completed','cancelled','rejected','awaiting_affiliate'].includes(j.status)).length,
      completedJobs:  myJobs.filter(j => j.status === 'completed').length,
      totalDrivers:   myDrivers.length,
      activeDrivers:  myDrivers.filter(d => d.status === 'available').length,
      totalVehicles:  myVehicles.length,
      totalEarnings:  parseFloat(myEarnings.reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
      pendingPayout:  parseFloat(myEarnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
    },
  });
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
router.get('/jobs/new', (_req: Request, res: Response) => {
  const available = jobs.filter(j => j.status === 'awaiting_affiliate').sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  res.json({ success: true, data: available, total: available.length });
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
router.get('/jobs/accepted', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const list = jobs
    .filter(j => j.affiliateId === affId && !['awaiting_affiliate','cancelled','rejected'].includes(j.status))
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  res.json({ success: true, data: list, total: list.length });
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
router.get('/jobs/history', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const list = jobs
    .filter(j => j.affiliateId === affId && ['completed','cancelled','rejected'].includes(j.status))
    .sort((a, b) => b.dateTime.localeCompare(a.dateTime));
  res.json({ success: true, data: list, total: list.length });
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
router.get('/jobs/:id', (req: Request, res: Response) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
  res.json({ success: true, data: job });
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
router.post('/jobs/:id/accept', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
  if (job.status !== 'awaiting_affiliate') {
    res.status(409).json({ success: false, message: `Cannot accept job in status: ${job.status}` }); return;
  }
  job.affiliateId = affId;
  job.status = 'needs_allocation';
  job.updatedAt = new Date().toISOString();
  res.json({ success: true, message: 'Job accepted', data: job });
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
router.post('/jobs/:id/reject', (req: Request, res: Response) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
  job.status = 'rejected';
  job.updatedAt = new Date().toISOString();
  res.json({ success: true, message: 'Job rejected', data: job });
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
router.post('/jobs/:id/assign-driver', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const job = jobs.find(j => j.id === req.params.id && j.affiliateId === affId);
  if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
  const { driverId } = req.body as { driverId: string };
  const driver = drivers.find(d => d.id === driverId && d.isApproved);
  if (!driver) { res.status(404).json({ success: false, message: 'Driver not found or not approved' }); return; }
  job.assignedDriverId = driverId;
  job.status = 'driver_assigned';
  job.updatedAt = new Date().toISOString();
  driver.status = 'busy';
  pushNotification(driverId, 'driver', 'Job Assigned', `You have been assigned to job ${job.bookingRef}. Pickup: ${job.pickupAddress}`, 'job');
  res.json({ success: true, message: 'Driver assigned', data: job });
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
router.post('/jobs/:id/assign-vehicle', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const job = jobs.find(j => j.id === req.params.id && j.affiliateId === affId);
  if (!job) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
  const { vehicleId } = req.body as { vehicleId: string };
  const vehicle = fleetVehicles.find(v => v.id === vehicleId);
  if (!vehicle) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
  job.assignedVehicleId = vehicleId;
  job.status = 'vehicle_assigned';
  job.updatedAt = new Date().toISOString();
  vehicle.status = 'in_use';
  if (job.assignedDriverId) {
    pushNotification(job.assignedDriverId, 'driver', 'Vehicle Allocated', `Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.registration}) allocated to job ${job.bookingRef}.`, 'job');
  }
  res.json({ success: true, message: 'Vehicle assigned', data: job });
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
router.get('/drivers', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const list = drivers.filter(d => d.affiliateId === affId).map(({ passwordHash: _, ...d }) => d);
  res.json({ success: true, data: list, total: list.length });
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
router.post('/drivers', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const b = req.body as Driver & { password: string };
  if (!b.fullName || !b.email || !b.phone || !b.password) {
    res.status(400).json({ success: false, message: 'Missing required fields' }); return;
  }
  if (drivers.find(d => d.email === b.email)) {
    res.status(409).json({ success: false, message: 'Email already registered' }); return;
  }
  const newDriver: Driver = {
    id: `drv-${uuid()}`,
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
    documents: [
      { id: uuid(), type: 'driving_licence', label: 'Driving Licence', status: 'missing' },
      { id: uuid(), type: 'phv_badge', label: 'PHV Badge', status: 'missing' },
      { id: uuid(), type: 'dbs_check', label: 'DBS Check', status: 'missing' },
      { id: uuid(), type: 'insurance', label: 'Insurance Certificate', status: 'missing' },
    ],
    isApproved: false,
    joinedDate: new Date().toISOString(),
  };
  drivers.push(newDriver);
  const { passwordHash: _, ...safe } = newDriver;
  res.status(201).json({ success: true, message: 'Driver added. Pending admin approval.', data: safe });
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
router.get('/drivers/:id', (req: Request, res: Response) => {
  const d = drivers.find(x => x.id === req.params.id);
  if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  const { passwordHash: _, ...safe } = d;
  const driverJobs = jobs.filter(j => j.assignedDriverId === d.id);
  res.json({ success: true, data: safe, jobs: driverJobs });
});

router.put('/drivers/:id/remove', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const idx = drivers.findIndex(d => d.id === req.params.id && d.affiliateId === affId);
  if (idx === -1) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  drivers.splice(idx, 1);
  res.json({ success: true, message: 'Driver removed' });
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
router.get('/vehicles', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const list = fleetVehicles.filter(v => v.affiliateId === affId);
  res.json({ success: true, data: list, total: list.length });
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
router.post('/vehicles', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const b = req.body as Omit<FleetVehicle, 'id' | 'status' | 'affiliateId'>;
  const v: FleetVehicle = { id: `fv-${uuid()}`, status: 'available', affiliateId: affId, ...b };
  fleetVehicles.push(v);
  res.status(201).json({ success: true, data: v });
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
router.put('/vehicles/:id', (req: Request, res: Response) => {
  const idx = fleetVehicles.findIndex(v => v.id === req.params.id);
  if (idx === -1) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
  fleetVehicles[idx] = { ...fleetVehicles[idx], ...req.body, id: req.params.id };
  res.json({ success: true, data: fleetVehicles[idx] });
});

router.put('/vehicles/:id/remove', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const idx = fleetVehicles.findIndex(v => v.id === req.params.id && v.affiliateId === affId);
  if (idx === -1) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
  fleetVehicles.splice(idx, 1);
  res.json({ success: true, message: 'Vehicle removed' });
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
router.get('/earnings', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const myEarnings = earnings.filter(e => e.entityId === affId && e.entityType === 'affiliate')
    .sort((a, b) => b.date.localeCompare(a.date));
  const summary = {
    total:      parseFloat(myEarnings.reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
    paid:       parseFloat(myEarnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
    pending:    parseFloat(myEarnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.netAmount, 0).toFixed(2)),
    jobCount:   myEarnings.length,
  };
  res.json({ success: true, data: myEarnings, summary });
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
router.get('/profile', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const a = affiliates.find(x => x.id === affId);
  if (!a) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
  const { passwordHash: _, ...safe } = a;
  res.json({ success: true, data: safe });
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
router.put('/profile', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const a = affiliates.find(x => x.id === affId);
  if (!a) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
  const { passwordHash: _ph, id: _id, isApproved: _ia, createdAt: _ca, ...allowed } = req.body as Partial<typeof a>;
  Object.assign(a, allowed);
  const { passwordHash: _, ...safe } = a;
  res.json({ success: true, data: safe });
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
router.get('/notifications', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const list = notifications.filter(n => n.recipientId === affId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ success: true, data: list, unread: list.filter(n => !n.isRead).length });
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
router.put('/notifications/read-all', (req: Request, res: Response) => {
  const affId = getAffId(req);
  notifications.filter(n => n.recipientId === affId).forEach(n => { n.isRead = true; });
  res.json({ success: true, message: 'All notifications marked as read' });
});

// ─── Documents ────────────────────────────────────────────────────────────────

router.get('/documents', (req: Request, res: Response) => {
  const affId = getAffId(req);
  const aff = affiliates.find(a => a.id === affId);
  if (!aff) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
  const docs = [
    { id: 'adoc_1', type: 'operator_licence',  label: 'Operator Licence',      status: aff.isApproved ? 'approved' : 'pending' },
    { id: 'adoc_2', type: 'insurance',          label: 'Insurance Document',    status: aff.isApproved ? 'approved' : 'pending' },
    { id: 'adoc_3', type: 'company_cert',       label: 'Company Certificate',   status: aff.isApproved ? 'approved' : 'pending' },
    { id: 'adoc_4', type: 'proof_of_address',   label: 'Proof of Address',      status: aff.isApproved ? 'approved' : 'pending' },
  ];
  res.json({ success: true, data: docs });
});

export default router;
