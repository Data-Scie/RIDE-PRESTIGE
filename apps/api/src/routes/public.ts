import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/db';
import { estimateDistance, estimateHours, calculateFare, applyCommission } from '../services/fareService';
import { pushNotification } from '../services/notificationService';
import type { VehicleCategory, BookingType } from '../types';

const router = Router();

router.get('/affiliates', async (_req: Request, res: Response) => {
  try {
    const affiliates = await prisma.affiliate.findMany({
      where: { isApproved: true },
      orderBy: { companyName: 'asc' },
      select: { id: true, companyName: true, tradingName: true, city: true },
    });
    res.json({ success: true, data: affiliates });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Fleet & Site ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/public/site-settings:
 *   get:
 *     summary: Get public site settings (name, contact, branding)
 *     tags: [Public]
 *     responses:
 *       200: { description: Site settings }
 */
router.get('/site-settings', async (_req: Request, res: Response) => {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    res.json({ success: true, data: s });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/public/navigation:
 *   get:
 *     summary: Get site navigation links
 *     tags: [Public]
 *     responses:
 *       200: { description: Navigation items }
 */
router.get('/navigation', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.navigationItem.findMany({
      where: { visible: true },
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/public/fleet/categories:
 *   get:
 *     summary: Get all fleet categories
 *     tags: [Public]
 *     responses:
 *       200: { description: Fleet categories }
 */
router.get('/fleet/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.websiteFleetCategory.findMany({
      where: { available: true },
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/public/fleet:
 *   get:
 *     summary: Get all website fleet vehicles (optionally filter by category)
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [prestige, minibus, coaches, taxi] }
 *         description: Filter by category slug
 *     responses:
 *       200: { description: Vehicles list }
 */
router.get('/fleet', async (req: Request, res: Response) => {
  try {
    const { category } = req.query as { category?: string };
    const where = { available: true, ...(category ? { categorySlug: category } : {}) };
    const vehicles = await prisma.websiteVehicle.findMany({ where });
    res.json({ success: true, data: vehicles, total: vehicles.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/public/fleet/{id}:
 *   get:
 *     summary: Get a single fleet vehicle by ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vehicle }
 *       404: { description: Not found }
 */
router.get('/fleet/:id', async (req: Request, res: Response) => {
  try {
    const v = await prisma.websiteVehicle.findUnique({ where: { id: req.params.id } });
    if (!v) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
    res.json({ success: true, data: v });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/public/pricing:
 *   get:
 *     summary: Get pricing configuration
 *     tags: [Public]
 *     responses:
 *       200: { description: Pricing config and cancellation policy }
 */
router.get('/pricing', async (_req: Request, res: Response) => {
  try {
    const p = await prisma.pricingConfig.findUnique({ where: { id: 'default' } });
    const shaped = p ? {
      prestige: { ratePerMile: p.prestigeRatePerMile, hourlyRate: p.prestigeHourlyRate },
      minibus:  { ratePerMile: p.minibusRatePerMile, rate16Seater: p.minibusRate16Seater, rate24Seater: p.minibusRate24Seater, rate32Seater: p.minibusRate32Seater },
      coaches:  { ratePerMile: p.coachesRatePerMile, hourlyRate: p.coachesHourlyRate },
      taxi:     { ratePerMile: p.taxiRatePerMile, minimumFare: p.taxiMinimumFare },
      driverSearchRadiusMiles: p.driverSearchRadiusMiles,
      commissionPercentage: p.commissionPercentage,
      driverPayoutPercentage: p.driverPayoutPercentage,
    } : null;
    const cancellationPolicy = {
      minHoursBeforeRide: 8,
      refundWindowHours: 48,
      message: 'Cancellations must be made at least 8 hours before your ride. Refunds processed within 48 hours of approval.',
    };
    res.json({ success: true, data: { pricing: shaped, cancellationPolicy } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/public/promotions:
 *   get:
 *     summary: Get active promotions
 *     tags: [Public]
 *     responses:
 *       200: { description: Active promotions list }
 */
router.get('/promotions', async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const promotions = await prisma.promotion.findMany({
      where: {
        active: true,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });
    res.json({ success: true, data: promotions });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/public/faqs:
 *   get:
 *     summary: Get FAQ items
 *     tags: [Public]
 *     responses:
 *       200: { description: FAQ list }
 */
router.get('/faqs', async (_req: Request, res: Response) => {
  try {
    const faqs = await prisma.fAQItem.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: faqs });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Quote ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/public/quote:
 *   post:
 *     summary: Generate a fare quote
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupPostcode, dropoffPostcode, vehicleCategory, passengers, bookingType]
 *             properties:
 *               pickupPostcode:  { type: string, example: "S1 1AB" }
 *               dropoffPostcode: { type: string, example: "M90 1QX" }
 *               vehicleCategory: { type: string, enum: [prestige, minibus, coaches, taxi] }
 *               passengers:      { type: number, example: 3 }
 *               bookingType:     { type: string, enum: [current, scheduled] }
 *               date:            { type: string, example: "2026-07-01" }
 *               time:            { type: string, example: "09:00" }
 *               notes:           { type: string }
 *               couponCode:      { type: string, example: "AIRPORT15" }
 *     responses:
 *       200: { description: Quote result }
 */
router.post('/quote', (req: Request, res: Response) => {
  const { pickupPostcode, dropoffPostcode, vehicleCategory, passengers, bookingType, date, time, notes, couponCode } =
    req.body as {
      pickupPostcode: string; dropoffPostcode: string; vehicleCategory: VehicleCategory;
      passengers: number; bookingType: BookingType; date?: string; time?: string; notes?: string; couponCode?: string;
    };

  if (!pickupPostcode || !dropoffPostcode || !vehicleCategory || !passengers || !bookingType) {
    res.status(400).json({ success: false, message: 'pickupPostcode, dropoffPostcode, vehicleCategory, passengers, bookingType are required' });
    return;
  }

  const miles  = estimateDistance(pickupPostcode, dropoffPostcode);
  const hours  = estimateHours(miles);
  const calc   = calculateFare(vehicleCategory, miles, hours, passengers, couponCode);
  const quoteId = `qt-${uuid()}`;
  const ref     = `RP-QUOTE-${Date.now()}`;
  const expiry  = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const quote = {
    id: quoteId,
    bookingRef: ref,
    createdAt: new Date().toISOString(),
    expiresAt: expiry,
    journey: { pickupPostcode, dropoffPostcode, passengers, vehicleCategory, bookingType, date, time, notes },
    calculation: calc,
    status: 'pending',
  };

  res.json({ success: true, data: quote });
});

// ─── Booking ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/public/booking:
 *   post:
 *     summary: Create a booking (public — no account required)
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, email, pickupPostcode, dropoffPostcode, vehicleCategory, passengers, bookingType]
 *             properties:
 *               fullName:        { type: string, example: "John Smith" }
 *               phone:           { type: string, example: "+44 7700 900999" }
 *               email:           { type: string, example: "john@example.com" }
 *               pickupPostcode:  { type: string, example: "S1 1AB" }
 *               dropoffPostcode: { type: string, example: "M90 1QX" }
 *               vehicleCategory: { type: string, enum: [prestige, minibus, coaches, taxi] }
 *               passengers:      { type: number, example: 3 }
 *               bookingType:     { type: string, enum: [current, scheduled] }
 *               date:            { type: string, example: "2026-07-01" }
 *               time:            { type: string, example: "09:00" }
 *               notes:           { type: string }
 *               couponCode:      { type: string }
 *               quoteId:         { type: string }
 *     responses:
 *       201: { description: Booking created }
 */
router.post('/booking', async (req: Request, res: Response) => {
  const { fullName, phone, email, pickupPostcode, dropoffPostcode, vehicleCategory, passengers,
          bookingType, date, time, notes, couponCode } = req.body as {
    fullName: string; phone: string; email: string;
    pickupPostcode: string; dropoffPostcode: string; vehicleCategory: VehicleCategory;
    passengers: number; bookingType: BookingType; date?: string; time?: string;
    notes?: string; couponCode?: string;
  };

  if (!fullName || !phone || !email || !pickupPostcode || !dropoffPostcode || !vehicleCategory || !passengers || !bookingType) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }

  try {
    const miles = estimateDistance(pickupPostcode, dropoffPostcode);
    const hours = estimateHours(miles);
    const calc  = calculateFare(vehicleCategory, miles, hours, passengers, couponCode);
    const { commission, affiliatePayout, driverPayout } = applyCommission(calc.total);

    const ref = `RP-${new Date().getFullYear()}-${uuid().split('-')[0].toUpperCase()}`;
    const existingCustomer = await prisma.customer.findUnique({ where: { email } });

    // Determine scheduled dateTime — use provided date/time for scheduled, or now for immediate
    let rideDateTime: Date;
    if (bookingType === 'scheduled' && date) {
      const dateTimeStr = time ? `${date}T${time}:00` : `${date}T00:00:00`;
      rideDateTime = new Date(dateTimeStr);
    } else {
      rideDateTime = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now for immediate bookings
    }

    const jobId = `job-${uuid()}`;
    const bookingId = `bk-${uuid()}`;

    const { bookingRow, jobRow } = await prisma.$transaction(async tx => {
      const bookingRow = await tx.booking.create({
        data: {
          id: bookingId,
          reference: ref,
          status: 'pending',
          customerId: existingCustomer?.id,
          customerData: { fullName, phone, email },
          journeyData: { pickupPostcode, dropoffPostcode, bookingType, date, time, passengers, notes },
          vehicleCategory,
          estimatedMiles: miles,
          estimatedFare: calc.total,
          couponCode,
          discountAmount: calc.discount,
          jobId,
        },
      });
      const jobRow = await tx.job.create({
        data: {
          id: jobId,
          bookingRef: ref,
          bookingId,
          customerId: existingCustomer?.id,
          customerName: fullName,
          customerPhone: phone,
          customerEmail: email,
          pickupAddress: pickupPostcode,
          dropoffAddress: dropoffPostcode,
          dateTime: rideDateTime,
          passengerCount: Number(passengers),
          luggageCount: 0,
          vehicleTypeRequested: vehicleCategory,
          vehicleCategory,
          fareAmount: calc.total,
          commissionAmount: commission,
          affiliatePayoutAmount: affiliatePayout,
          driverPayoutAmount: driverPayout,
          distance: `${miles} miles`,
          estimatedDuration: `${Math.round(hours * 60)} min`,
          specialInstructions: notes,
          status: 'awaiting_affiliate',
        },
      });
      await tx.rideStatusHistory.create({
        data: { jobId, fromStatus: null, toStatus: 'awaiting_affiliate', changedByRole: 'customer', notes: 'Booking created' },
      });
      if (existingCustomer) {
        await tx.customer.update({
          where: { id: existingCustomer.id },
          data: { totalBookings: { increment: 1 } },
        });
      }
      return { bookingRow, jobRow };
    });

    // Notify admin
    await pushNotification('admin-1', 'admin', 'New Booking', `New booking ${ref} from ${fullName} — £${calc.total}`, 'booking');

    // Dispatch — notify all approved affiliates and approved independent drivers
    const [affiliates, independentDrivers] = await Promise.all([
      prisma.affiliate.findMany({ where: { isApproved: true }, select: { id: true } }),
      prisma.driver.findMany({ where: { isApproved: true, driverType: 'independentDriver', status: { not: 'busy' } }, select: { id: true } }),
    ]);

    const notifTitle = 'New Job Available';
    const notifBody  = `Job ${ref}: ${pickupPostcode} → ${dropoffPostcode} — £${calc.total} — ${rideDateTime.toLocaleDateString('en-GB')}`;

    await Promise.all([
      ...affiliates.map(a => pushNotification(a.id, 'affiliate', notifTitle, notifBody, 'job')),
      ...independentDrivers.map(d => pushNotification(d.id, 'driver', notifTitle, notifBody, 'job')),
    ]);

    const booking = {
      id: bookingRow.id, reference: bookingRow.reference, status: bookingRow.status,
      createdAt: bookingRow.createdAt.toISOString(), updatedAt: bookingRow.updatedAt.toISOString(),
      customer: bookingRow.customerData,
      journey: bookingRow.journeyData,
      vehicleCategory: bookingRow.vehicleCategory,
      estimatedMiles: bookingRow.estimatedMiles,
      estimatedFare: bookingRow.estimatedFare,
      couponCode: bookingRow.couponCode,
      discountAmount: bookingRow.discountAmount,
      jobId: jobRow.id,
    };

    res.status(201).json({ success: true, data: { booking, quote: { calculation: calc, commission, affiliatePayout, driverPayout } } });
  } catch (e) {
    console.error('Booking creation error:', e);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/public/booking/{reference}:
 *   get:
 *     summary: Look up a booking by reference (public)
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema: { type: string }
 *         example: RP-2026-1001
 *     responses:
 *       200: { description: Booking }
 *       404: { description: Not found }
 */
router.get('/booking/:reference', async (req: Request, res: Response) => {
  try {
    const b = await prisma.booking.findUnique({ where: { reference: req.params.reference } });
    if (!b) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    const shaped = {
      id: b.id, reference: b.reference, status: b.status,
      createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString(),
      customer: b.customerData, journey: b.journeyData,
      vehicleCategory: b.vehicleCategory, estimatedMiles: b.estimatedMiles, estimatedFare: b.estimatedFare,
    };
    res.json({ success: true, data: shaped });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/booking/:reference/rate', async (req: Request, res: Response) => {
  try {
    const { email, rating, feedback } = req.body as { email?: string; rating?: number; feedback?: string };
    if (!email || !rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Booking email and a rating from 1 to 5 are required' });
      return;
    }
    const booking = await prisma.booking.findUnique({ where: { reference: req.params.reference } });
    if (!booking?.jobId) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    const customer = booking.customerData as { email?: string };
    if (!customer.email || customer.email.toLowerCase() !== email.trim().toLowerCase()) {
      res.status(403).json({ success: false, message: 'Booking email does not match' });
      return;
    }
    const job = await prisma.job.findFirst({ where: { id: booking.jobId, status: 'completed' } });
    if (!job) {
      res.status(400).json({ success: false, message: 'The ride can be rated after it is completed' });
      return;
    }
    if (job.customerRating) {
      res.status(409).json({ success: false, message: 'This ride has already been rated' });
      return;
    }
    await prisma.job.update({
      where: { id: job.id },
      data: {
        customerRating: rating,
        customerFeedback: feedback?.trim().slice(0, 1000) || null,
      },
    });
    if (job.assignedDriverId) {
      const aggregate = await prisma.job.aggregate({
        where: { assignedDriverId: job.assignedDriverId, customerRating: { not: null } },
        _avg: { customerRating: true },
      });
      await prisma.driver.update({
        where: { id: job.assignedDriverId },
        data: { rating: parseFloat((aggregate._avg.customerRating ?? rating).toFixed(1)) },
      });
    }
    res.json({ success: true, message: 'Thank you for your feedback' });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Approved Affiliates (public, for driver registration dropdown) ───────────

router.get('/affiliates', async (_req: Request, res: Response) => {
  try {
    const affiliates = await prisma.affiliate.findMany({
      where: { isApproved: true },
      select: { id: true, companyName: true, tradingName: true, city: true },
      orderBy: { companyName: 'asc' },
    });
    res.json({ success: true, data: affiliates });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Contact / Support ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/public/contact:
 *   post:
 *     summary: Submit a contact / support enquiry
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name:             { type: string }
 *               email:            { type: string }
 *               phone:            { type: string }
 *               subject:          { type: string }
 *               message:          { type: string }
 *               bookingReference: { type: string }
 *               type:             { type: string, enum: [enquiry, complaint, booking_support, other] }
 *     responses:
 *       201: { description: Ticket created }
 */
router.post('/contact', async (req: Request, res: Response) => {
  const { name, email, phone, subject, message, bookingReference, type } = req.body as {
    name: string; email: string; phone?: string; subject: string; message: string; bookingReference?: string; type?: string;
  };
  if (!name || !email || !subject || !message) {
    res.status(400).json({ success: false, message: 'name, email, subject, and message are required' });
    return;
  }
  try {
    const count = await prisma.supportTicket.count();
    const ref = `TK-${String(count + 1).padStart(3, '0')}`;
    const ticket = await prisma.supportTicket.create({
      data: {
        id: `tk-${uuid()}`,
        reference: ref,
        type: type ?? 'enquiry',
        status: 'open',
        customerData: { name, email, phone },
        bookingReference,
        subject,
        message,
      },
    });
    await pushNotification('admin-1', 'admin', 'New Support Ticket', `New ticket ${ref} from ${name}: ${subject}`, 'system');
    res.status(201).json({ success: true, message: `Ticket submitted. Reference: ${ref}`, data: { reference: ref } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

export default router;
