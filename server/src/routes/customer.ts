import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate, requireRole } from '../middleware/auth';
import { customers, bookings, quotes, jobs, affiliates, drivers } from '../data/store';
import { estimateDistance, estimateHours, calculateFare, applyCommission } from '../services/fareService';
import { pushNotification } from '../services/notificationService';
import type { Booking, Job, QuoteResult, VehicleCategory, VehicleType, BookingType } from '../types';

const router = Router();
router.use(authenticate, requireRole('customer', 'admin', 'ops'));

const getCustId = (req: Request): string => req.user!.id;

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/customer/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Customer profile }
 */
router.get('/profile', (req: Request, res: Response) => {
  const custId = getCustId(req);
  const c = customers.find(x => x.id === custId);
  if (!c) { res.status(404).json({ success: false, message: 'Customer not found' }); return; }
  const { passwordHash: _, ...safe } = c;
  res.json({ success: true, data: safe });
});

/**
 * @swagger
 * /api/customer/profile:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Updated profile }
 */
router.put('/profile', (req: Request, res: Response) => {
  const custId = getCustId(req);
  const c = customers.find(x => x.id === custId);
  if (!c) { res.status(404).json({ success: false, message: 'Customer not found' }); return; }
  const { passwordHash: _ph, id: _id, ...allowed } = req.body as Partial<typeof c>;
  Object.assign(c, allowed);
  const { passwordHash: _, ...safe } = c;
  res.json({ success: true, data: safe });
});

// ─── Quote ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/customer/quote:
 *   post:
 *     summary: Generate a quote (authenticated customer)
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupPostcode, dropoffPostcode, vehicleCategory, passengers, bookingType]
 *             properties:
 *               pickupPostcode:  { type: string }
 *               dropoffPostcode: { type: string }
 *               vehicleCategory: { type: string, enum: [prestige, minibus, coaches, taxi] }
 *               passengers:      { type: number }
 *               bookingType:     { type: string, enum: [current, scheduled] }
 *               date:            { type: string }
 *               time:            { type: string }
 *               notes:           { type: string }
 *               couponCode:      { type: string }
 *     responses:
 *       200: { description: Quote }
 */
router.post('/quote', (req: Request, res: Response) => {
  const { pickupPostcode, dropoffPostcode, vehicleCategory, passengers, bookingType, date, time, notes, couponCode } =
    req.body as {
      pickupPostcode: string; dropoffPostcode: string; vehicleCategory: VehicleCategory;
      passengers: number; bookingType: BookingType; date?: string; time?: string; notes?: string; couponCode?: string;
    };
  if (!pickupPostcode || !dropoffPostcode || !vehicleCategory || !passengers || !bookingType) {
    res.status(400).json({ success: false, message: 'Missing required fields' }); return;
  }
  const miles  = estimateDistance(pickupPostcode, dropoffPostcode);
  const hours  = estimateHours(miles);
  const calc   = calculateFare(vehicleCategory, miles, hours, passengers, couponCode);
  const ref    = `RP-QUOTE-${Date.now()}`;
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const quote: QuoteResult = {
    id: `qt-${uuid()}`,
    bookingRef: ref,
    createdAt: new Date().toISOString(),
    expiresAt: expiry,
    journey: { pickupPostcode, dropoffPostcode, passengers, vehicleCategory, bookingType, date, time, notes },
    calculation: calc,
    status: 'pending',
  };
  quotes.push(quote);
  res.json({ success: true, data: quote });
});

// ─── Bookings ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/customer/bookings:
 *   get:
 *     summary: Get customer's bookings
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Bookings }
 */
router.get('/bookings', (req: Request, res: Response) => {
  const custId = getCustId(req);
  const list = bookings.filter(b => b.customerId === custId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ success: true, data: list, total: list.length });
});

/**
 * @swagger
 * /api/customer/bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking }
 */
router.get('/bookings/:id', (req: Request, res: Response) => {
  const custId = getCustId(req);
  const b = bookings.find(x => x.id === req.params.id && (x.customerId === custId || req.user!.role !== 'customer'));
  if (!b) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
  const job = b.jobId ? jobs.find(j => j.id === b.jobId) : null;
  const jobSummary = job ? { status: job.status, driverAssigned: !!job.assignedDriverId, vehicleAssigned: !!job.assignedVehicleId } : null;
  res.json({ success: true, data: b, jobSummary });
});

/**
 * @swagger
 * /api/customer/bookings:
 *   post:
 *     summary: Create a booking (authenticated customer)
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupPostcode, dropoffPostcode, vehicleCategory, passengers, bookingType]
 *             properties:
 *               pickupPostcode:  { type: string }
 *               dropoffPostcode: { type: string }
 *               vehicleCategory: { type: string, enum: [prestige, minibus, coaches, taxi] }
 *               passengers:      { type: number }
 *               bookingType:     { type: string, enum: [current, scheduled] }
 *               date:            { type: string }
 *               time:            { type: string }
 *               notes:           { type: string }
 *               couponCode:      { type: string }
 *               quoteId:         { type: string }
 *     responses:
 *       201: { description: Booking created }
 */
router.post('/bookings', (req: Request, res: Response) => {
  const custId = getCustId(req);
  const c = customers.find(x => x.id === custId);
  if (!c) { res.status(404).json({ success: false, message: 'Customer not found' }); return; }

  const { pickupPostcode, dropoffPostcode, vehicleCategory, passengers, bookingType, date, time, notes, couponCode, quoteId } =
    req.body as {
      pickupPostcode: string; dropoffPostcode: string; vehicleCategory: VehicleCategory;
      passengers: number; bookingType: BookingType; date?: string; time?: string;
      notes?: string; couponCode?: string; quoteId?: string;
    };

  if (!pickupPostcode || !dropoffPostcode || !vehicleCategory || !passengers || !bookingType) {
    res.status(400).json({ success: false, message: 'Missing required fields' }); return;
  }

  const miles = estimateDistance(pickupPostcode, dropoffPostcode);
  const hours = estimateHours(miles);
  const calc  = calculateFare(vehicleCategory, miles, hours, passengers, couponCode);
  const ref   = `RP-${new Date().getFullYear()}-${String(bookings.length + 1001).padStart(4, '0')}`;
  const n     = new Date().toISOString();

  const booking: Booking = {
    id: `bk-${uuid()}`,
    reference: ref,
    status: 'pending',
    createdAt: n,
    updatedAt: n,
    customerId: custId,
    customer: { fullName: c.fullName, phone: c.phone, email: c.email },
    journey: { pickupPostcode, dropoffPostcode, bookingType, date, time, passengers, notes },
    vehicleCategory,
    estimatedMiles: miles,
    estimatedFare: calc.total,
    couponCode,
    discountAmount: calc.discount,
  };
  bookings.push(booking);
  c.totalBookings += 1;

  if (quoteId) {
    const q = quotes.find(x => x.id === quoteId);
    if (q) q.status = 'accepted';
  }

  // Auto-create operational job so affiliates can dispatch immediately (Uber-like flow)
  const categoryTypeMap: Record<string, VehicleType> = {
    prestige: 'Executive', minibus: 'Minibus', coaches: 'Coach', taxi: 'Saloon',
  };
  const jobDateTime = (date && time) ? `${date}T${time}:00Z`
    : new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const { commission, affiliatePayout, driverPayout } = applyCommission(calc.total);
  const job: Job = {
    id: `job-${uuid()}`,
    bookingRef: ref,
    bookingId: booking.id,
    customerId: custId,
    customerName: c.fullName,
    customerPhone: c.phone,
    customerEmail: c.email,
    pickupAddress: pickupPostcode,
    dropoffAddress: dropoffPostcode,
    stops: [],
    dateTime: jobDateTime,
    passengerCount: passengers,
    luggageCount: 0,
    vehicleTypeRequested: categoryTypeMap[vehicleCategory] ?? 'Executive',
    vehicleCategory,
    fareAmount: calc.total,
    commissionAmount: commission,
    affiliatePayoutAmount: affiliatePayout,
    driverPayoutAmount: driverPayout,
    distance: `${miles} miles`,
    estimatedDuration: `${Math.round(miles / 40 * 60)} min`,
    specialInstructions: notes,
    status: 'awaiting_affiliate',
    createdAt: n,
    updatedAt: n,
  };
  jobs.push(job);
  booking.jobId = job.id;

  // Notify all approved affiliates so they can accept and dispatch
  affiliates.filter(a => a.isApproved).forEach(a => {
    pushNotification(a.id, 'affiliate', 'New Job Available', `Job ${ref} — ${pickupPostcode} → ${dropoffPostcode}`, 'job');
  });

  pushNotification('admin-1', 'admin', 'New Booking', `${c.fullName} booked ${ref} — £${calc.total}`, 'booking');
  res.status(201).json({ success: true, data: booking, job, calculation: calc });
});

/**
 * @swagger
 * /api/customer/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking
 *     tags: [Customer]
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
router.put('/bookings/:id/cancel', (req: Request, res: Response) => {
  const custId = getCustId(req);
  const b = bookings.find(x => x.id === req.params.id && x.customerId === custId);
  if (!b) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
  if (['completed','cancelled'].includes(b.status)) {
    res.status(409).json({ success: false, message: `Cannot cancel a booking in status: ${b.status}` }); return;
  }
  b.status = 'cancelled';
  b.updatedAt = new Date().toISOString();
  // Also cancel the linked job
  if (b.jobId) {
    const job = jobs.find(j => j.id === b.jobId);
    if (job && !['completed','cancelled'].includes(job.status)) {
      job.status = 'cancelled';
      job.updatedAt = b.updatedAt;
      if (job.affiliateId) {
        pushNotification(job.affiliateId, 'affiliate', 'Job Cancelled', `Job ${job.bookingRef} has been cancelled by the customer.`, 'job');
      }
    }
  }
  res.json({ success: true, message: 'Booking cancelled', data: b });
});

// ─── Live Tracking ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/customer/bookings/{id}/track:
 *   get:
 *     summary: Track driver live location for an active booking
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Live tracking data including driver location and ride status }
 */
router.get('/bookings/:id/track', (req: Request, res: Response) => {
  const custId = getCustId(req);
  const b = bookings.find(x => x.id === req.params.id && x.customerId === custId);
  if (!b) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
  const job = b.jobId ? jobs.find(j => j.id === b.jobId) : null;
  if (!job) {
    res.json({ success: true, data: { bookingStatus: b.status, jobStatus: null, driver: null } }); return;
  }
  const driver = job.assignedDriverId ? drivers.find(d => d.id === job.assignedDriverId) : null;
  res.json({
    success: true,
    data: {
      bookingStatus: b.status,
      jobStatus: job.status,
      jobId: job.id,
      driver: driver ? {
        name: driver.fullName,
        phone: driver.phone,
        rating: driver.rating,
        latitude: driver.latitude ?? null,
        longitude: driver.longitude ?? null,
        lastLocationUpdate: driver.lastLocationUpdate ?? null,
      } : null,
    },
  });
});

// ─── Rate Driver ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/customer/bookings/{id}/rate:
 *   post:
 *     summary: Rate the driver after a completed ride
 *     tags: [Customer]
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
 *               rating:   { type: number, minimum: 1, maximum: 5, example: 5 }
 *               feedback: { type: string, example: "Excellent service, very punctual!" }
 *     responses:
 *       200: { description: Rating submitted }
 */
router.post('/bookings/:id/rate', (req: Request, res: Response) => {
  const custId = getCustId(req);
  const b = bookings.find(x => x.id === req.params.id && x.customerId === custId);
  if (!b) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
  const job = b.jobId ? jobs.find(j => j.id === b.jobId && j.status === 'completed') : null;
  if (!job) {
    res.status(400).json({ success: false, message: 'Can only rate a completed ride' }); return;
  }
  if (job.customerRating) {
    res.status(409).json({ success: false, message: 'You have already rated this ride' }); return;
  }
  const { rating } = req.body as { rating: number; feedback?: string };
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' }); return;
  }
  job.customerRating = rating;
  // Update driver's rolling average rating
  if (job.assignedDriverId) {
    const driver = drivers.find(d => d.id === job.assignedDriverId);
    if (driver && driver.totalJobs > 0) {
      driver.rating = parseFloat(((driver.rating * (driver.totalJobs - 1) + rating) / driver.totalJobs).toFixed(1));
    }
  }
  res.json({ success: true, message: 'Thank you for rating your ride!' });
});

export default router;
