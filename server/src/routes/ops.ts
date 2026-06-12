import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate, requireRole } from '../middleware/auth';
import {
  jobs, bookings, drivers, affiliates, fleetVehicles, customers, earnings, notifications,
} from '../data/store';
import { applyCommission } from '../services/fareService';
import { pushNotification } from '../services/notificationService';
import type { Job, JobStatus, FleetVehicle } from '../types';

const router = Router();
router.use(authenticate, requireRole('admin', 'ops'));

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
router.get('/dashboard', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      activeRides:        jobs.filter(j => ['on_route','arrived_pickup','passenger_onboard','in_progress'].includes(j.status)).length,
      awaitingAffiliate:  jobs.filter(j => j.status === 'awaiting_affiliate').length,
      needsAllocation:    jobs.filter(j => j.status === 'needs_allocation').length,
      completedToday:     jobs.filter(j => j.status === 'completed' && j.updatedAt.startsWith(new Date().toISOString().slice(0,10))).length,
      totalDrivers:       drivers.length,
      availableDrivers:   drivers.filter(d => d.status === 'available' && d.isApproved).length,
      totalAffiliates:    affiliates.length,
      pendingApprovals:   [...drivers.filter(d => !d.isApproved), ...affiliates.filter(a => !a.isApproved)].length,
    },
  });
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
router.get('/rides', (req: Request, res: Response) => {
  const { status, affiliateId } = req.query as Record<string, string>;
  let list = [...jobs].sort((a, b) => b.dateTime.localeCompare(a.dateTime));
  if (status) list = list.filter(j => j.status === status);
  if (affiliateId) list = list.filter(j => j.affiliateId === affiliateId);
  res.json({ success: true, data: list, total: list.length });
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
router.get('/rides/:id', (req: Request, res: Response) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) { res.status(404).json({ success: false, message: 'Ride not found' }); return; }
  const driver    = job.assignedDriverId ? drivers.find(d => d.id === job.assignedDriverId) : null;
  const affiliate = job.affiliateId ? affiliates.find(a => a.id === job.affiliateId) : null;
  const vehicle   = job.assignedVehicleId ? fleetVehicles.find(v => v.id === job.assignedVehicleId) : null;
  const { passwordHash: _d, ...safeDriver    } = driver    ?? { passwordHash: '' };
  const { passwordHash: _a, ...safeAffiliate } = affiliate ?? { passwordHash: '' };
  res.json({ success: true, data: job, driver: driver ? safeDriver : null, affiliate: affiliate ? safeAffiliate : null, vehicle: vehicle ?? null });
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
router.post('/rides', (req: Request, res: Response) => {
  const b = req.body as Partial<Job>;
  if (!b.customerName || !b.customerPhone || !b.pickupAddress || !b.dropoffAddress || !b.dateTime || !b.fareAmount) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }
  const { commission, affiliatePayout, driverPayout } = applyCommission(b.fareAmount!);
  const n   = new Date().toISOString();
  const ref = `RP-${new Date().getFullYear()}-${String(jobs.length + 2000).padStart(4, '0')}`;
  const job: Job = {
    id: `job-${uuid()}`,
    bookingRef: ref,
    customerName: b.customerName!,
    customerPhone: b.customerPhone!,
    customerEmail: b.customerEmail,
    pickupAddress: b.pickupAddress!,
    dropoffAddress: b.dropoffAddress!,
    stops: b.stops ?? [],
    dateTime: b.dateTime!,
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
    createdAt: n,
    updatedAt: n,
  };
  jobs.push(job);
  // Notify all approved affiliates
  affiliates.filter(a => a.isApproved).forEach(a => {
    pushNotification(a.id, 'affiliate', 'New Job Available', `Job ${ref} is available — ${job.pickupAddress} → ${job.dropoffAddress}`, 'job');
  });
  res.status(201).json({ success: true, data: job });
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
router.put('/rides/:id/status', (req: Request, res: Response) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) { res.status(404).json({ success: false, message: 'Ride not found' }); return; }
  const { status } = req.body as { status: JobStatus };
  job.status = status;
  job.updatedAt = new Date().toISOString();

  // Auto-create earnings when completed
  if (status === 'completed' && job.affiliateId && job.assignedDriverId) {
    earnings.push({
      id: `earn-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
      entityId: job.affiliateId!, entityType: 'affiliate',
      date: job.updatedAt, grossAmount: job.affiliatePayoutAmount,
      commissionDeducted: 0, netAmount: job.affiliatePayoutAmount, status: 'pending',
    });
    earnings.push({
      id: `earn-${uuid()}`, jobId: job.id, bookingRef: job.bookingRef,
      entityId: job.assignedDriverId!, entityType: 'driver',
      date: job.updatedAt, grossAmount: job.driverPayoutAmount,
      commissionDeducted: 0, netAmount: job.driverPayoutAmount, status: 'pending',
    });
    // Update linked booking
    const bk = bookings.find(b => b.jobId === job.id);
    if (bk) { bk.status = 'completed'; bk.updatedAt = job.updatedAt; }
  }
  res.json({ success: true, data: job });
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
router.put('/rides/:id/assign-affiliate', (req: Request, res: Response) => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) { res.status(404).json({ success: false, message: 'Ride not found' }); return; }
  const { affiliateId } = req.body as { affiliateId: string };
  const aff = affiliates.find(a => a.id === affiliateId && a.isApproved);
  if (!aff) { res.status(404).json({ success: false, message: 'Affiliate not found or not approved' }); return; }
  job.affiliateId = affiliateId;
  job.status = 'needs_allocation';
  job.updatedAt = new Date().toISOString();
  pushNotification(affiliateId, 'affiliate', 'Job Assigned', `Job ${job.bookingRef} has been assigned to you. Please allocate driver and vehicle.`, 'job');
  res.json({ success: true, data: job });
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
router.get('/vehicles', (_req: Request, res: Response) => {
  res.json({ success: true, data: fleetVehicles, total: fleetVehicles.length });
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
router.post('/vehicles', (req: Request, res: Response) => {
  const b = req.body as Omit<FleetVehicle, 'id' | 'status'>;
  const v: FleetVehicle = { id: `fv-${uuid()}`, status: 'available', ...b };
  fleetVehicles.push(v);
  res.status(201).json({ success: true, data: v });
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
router.put('/vehicles/:id', (req: Request, res: Response) => {
  const idx = fleetVehicles.findIndex(v => v.id === req.params.id);
  if (idx === -1) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
  fleetVehicles[idx] = { ...fleetVehicles[idx], ...req.body, id: req.params.id };
  res.json({ success: true, data: fleetVehicles[idx] });
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
router.get('/affiliates', (_req: Request, res: Response) => {
  const list = affiliates.map(({ passwordHash: _, ...a }) => ({
    ...a,
    driverCount:  drivers.filter(d => d.affiliateId === a.id).length,
    vehicleCount: fleetVehicles.filter(v => v.affiliateId === a.id).length,
  }));
  res.json({ success: true, data: list });
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
router.get('/affiliates/:id', (req: Request, res: Response) => {
  const a = affiliates.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
  const { passwordHash: _, ...safe } = a;
  const affDrivers   = drivers.filter(d => d.affiliateId === a.id).map(({ passwordHash: _p, ...d }) => d);
  const affVehicles  = fleetVehicles.filter(v => v.affiliateId === a.id);
  const affJobs      = jobs.filter(j => j.affiliateId === a.id);
  res.json({ success: true, data: safe, drivers: affDrivers, vehicles: affVehicles, jobs: affJobs });
});

router.put('/affiliates/:id/approve', (req: Request, res: Response) => {
  const a = affiliates.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
  a.isApproved = true;
  const { passwordHash: _, ...safe } = a;
  res.json({ success: true, message: 'Affiliate approved', data: safe });
});

router.put('/affiliates/:id/suspend', (req: Request, res: Response) => {
  const a = affiliates.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
  a.isApproved = false;
  const { passwordHash: _, ...safe } = a;
  res.json({ success: true, message: 'Affiliate suspended', data: safe });
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
router.get('/drivers', (_req: Request, res: Response) => {
  const list = drivers.map(({ passwordHash: _, ...d }) => d);
  res.json({ success: true, data: list, total: list.length });
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
router.get('/drivers/:id', (req: Request, res: Response) => {
  const d = drivers.find(x => x.id === req.params.id);
  if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  const { passwordHash: _, ...safe } = d;
  const driverJobs     = jobs.filter(j => j.assignedDriverId === d.id);
  const driverEarnings = earnings.filter(e => e.entityId === d.id);
  res.json({ success: true, data: safe, jobs: driverJobs, earnings: driverEarnings });
});

router.put('/drivers/:id/approve', (req: Request, res: Response) => {
  const d = drivers.find(x => x.id === req.params.id);
  if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  d.isApproved = true;
  const { passwordHash: _, ...safe } = d;
  res.json({ success: true, message: 'Driver approved', data: safe });
});

router.put('/drivers/:id/suspend', (req: Request, res: Response) => {
  const d = drivers.find(x => x.id === req.params.id);
  if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  d.isApproved = false;
  d.status = 'offline';
  const { passwordHash: _, ...safe } = d;
  res.json({ success: true, message: 'Driver suspended', data: safe });
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
router.get('/customers', (_req: Request, res: Response) => {
  const list = customers.map(({ passwordHash: _, ...c }) => ({
    ...c,
    bookings: bookings.filter(b => b.customerId === c.id).length,
  }));
  res.json({ success: true, data: list });
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
router.get('/earnings', (_req: Request, res: Response) => {
  const sorted = [...earnings].sort((a, b) => b.date.localeCompare(a.date));
  const totalPaid    = earnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.netAmount, 0);
  const totalPending = earnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.netAmount, 0);
  res.json({ success: true, data: sorted, summary: { totalPaid, totalPending, count: earnings.length } });
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
router.put('/earnings/:id/pay', (req: Request, res: Response) => {
  const e = earnings.find(x => x.id === req.params.id);
  if (!e) { res.status(404).json({ success: false, message: 'Earning not found' }); return; }
  e.status = 'paid';
  res.json({ success: true, data: e });
});

export default router;
