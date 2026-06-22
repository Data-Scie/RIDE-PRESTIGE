import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../lib/db';
import { estimateDistance, estimateHours, calculateFare, applyCommission, getPricingConfig } from '../services/fareService';
import { createIndependentRideOffers } from '../services/dispatchService';
import { pushNotification } from '../services/notificationService';
import { bookingConfirmationEmail, sendTransactionalEmail } from '../services/emailService';
import { bookingConfirmationSms, sendSms } from '../services/smsService';
import { createCheckoutSession, isStripeConfigured } from '../services/paymentService';
import type { VehicleCategory, VehicleType, BookingType, Stop } from '../types';

const router = Router();
router.use(authenticate, requireRole('customer', 'admin', 'ops'));

const getCustId = (req: Request): string => req.user!.id;

function normalizeStops(stops: unknown): Stop[] {
  if (!Array.isArray(stops)) return [];
  return stops
    .map((stop, index) => {
      if (typeof stop === 'string') {
        const address = stop.trim();
        return address ? { id: `stop-${index + 1}`, address, order: index + 1 } : null;
      }
      if (stop && typeof stop === 'object' && 'address' in stop) {
        const address = String((stop as { address?: unknown }).address ?? '').trim();
        return address ? { id: `stop-${index + 1}`, address, order: index + 1 } : null;
      }
      return null;
    })
    .filter((stop): stop is Stop => Boolean(stop));
}

// Helper to reshape a Prisma Booking row into the API shape the frontend expects
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
    id: b.id,
    reference: b.reference,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    customerId: b.customerId,
    customer: b.customerData as { fullName: string; phone: string; email: string },
    journey: b.journeyData as {
      pickupPostcode: string; dropoffPostcode: string; bookingType: BookingType;
      date?: string; time?: string; passengers: number; notes?: string;
    },
    vehicleCategory: b.vehicleCategory,
    vehicleId: b.vehicleId,
    estimatedMiles: b.estimatedMiles,
    estimatedFare: b.estimatedFare,
    couponCode: b.couponCode,
    discountAmount: b.discountAmount,
    adminNotes: b.adminNotes,
    jobId: b.jobId,
  };
}

// Helper to reshape a Prisma Job row
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
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const c = await prisma.customer.findUnique({ where: { id: getCustId(req) } });
    if (!c) { res.status(404).json({ success: false, message: 'Customer not found' }); return; }
    const { passwordHash: _, ...safe } = c;
    res.json({ success: true, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
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
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const { passwordHash: _ph, id: _id, createdAt: _ca, ...allowed } = req.body;
    const c = await prisma.customer.update({
      where: { id: getCustId(req) },
      data: allowed,
    });
    const { passwordHash: _, ...safe } = c;
    res.json({ success: true, data: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
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
router.post('/quote', async (req: Request, res: Response) => {
  const { pickupPostcode, dropoffPostcode, vehicleCategory, passengers, bookingType, date, time, notes, couponCode } =
    req.body as {
      pickupPostcode: string; dropoffPostcode: string; vehicleCategory: VehicleCategory;
      passengers: number; bookingType: BookingType; date?: string; time?: string; notes?: string; couponCode?: string;
    };
  if (!pickupPostcode || !dropoffPostcode || !vehicleCategory || !passengers || !bookingType) {
    res.status(400).json({ success: false, message: 'Missing required fields' }); return;
  }
  const pricing = await getPricingConfig();
  const miles   = await estimateDistance(pickupPostcode, dropoffPostcode);
  const hours   = estimateHours(miles);
  const calc    = calculateFare(vehicleCategory, miles, hours, passengers, couponCode, pricing);
  const ref     = `RP-QUOTE-${Date.now()}`;
  const expiry  = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const quote = {
    id: `qt-${uuid()}`,
    bookingRef: ref,
    createdAt: new Date().toISOString(),
    expiresAt: expiry,
    journey: { pickupPostcode, dropoffPostcode, passengers, vehicleCategory, bookingType, date, time, notes },
    calculation: calc,
    status: 'pending',
  };
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
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const rows = await prisma.booking.findMany({
      where: { customerId: getCustId(req) },
      orderBy: { createdAt: 'desc' },
    });
    const list = rows.map(shapeBooking);
    res.json({ success: true, data: list, total: list.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
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
router.get('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const custId = getCustId(req);
    const isAdminOrOps = req.user!.role !== 'customer';
    const row = await prisma.booking.findFirst({
      where: isAdminOrOps
        ? { id: req.params.id }
        : { id: req.params.id, customerId: custId },
    });
    if (!row) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    const b = shapeBooking(row);
    let jobSummary: { status: string; driverAssigned: boolean; vehicleAssigned: boolean } | null = null;
    if (b.jobId) {
      const job = await prisma.job.findUnique({ where: { id: b.jobId } });
      if (job) {
        jobSummary = {
          status: job.status,
          driverAssigned: !!job.assignedDriverId,
          vehicleAssigned: !!job.assignedVehicleId,
        };
      }
    }
    res.json({ success: true, data: b, jobSummary });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
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
router.post('/bookings', async (req: Request, res: Response) => {
  const custId = getCustId(req);
  try {
    const c = await prisma.customer.findUnique({ where: { id: custId } });
    if (!c) { res.status(404).json({ success: false, message: 'Customer not found' }); return; }
    if (!c.phone) {
      res.status(400).json({ success: false, message: 'Add a contact number to your profile before booking' });
      return;
    }

    const { pickupPostcode, dropoffPostcode, vehicleCategory, passengers, bookingType, date, time, notes, couponCode, stops } =
      req.body as {
        pickupPostcode: string; dropoffPostcode: string; vehicleCategory: VehicleCategory;
        passengers: number; bookingType: BookingType; date?: string; time?: string;
        notes?: string; couponCode?: string; stops?: unknown;
      };

    if (!pickupPostcode || !dropoffPostcode || !vehicleCategory || !passengers || !bookingType) {
      res.status(400).json({ success: false, message: 'Missing required fields' }); return;
    }

    const pricing = await getPricingConfig();
    const miles   = await estimateDistance(pickupPostcode, dropoffPostcode);
    const hours   = estimateHours(miles);
    const calc    = calculateFare(vehicleCategory, miles, hours, passengers, couponCode, pricing);
    const normalizedStops = normalizeStops(stops);
    const stopsJson = normalizedStops as unknown as Prisma.InputJsonValue;

    const ref = `RP-${new Date().getFullYear()}-${uuid().split('-')[0].toUpperCase()}`;

    // Create booking
    const bookingRow = await prisma.booking.create({
      data: {
        id: `bk-${uuid()}`,
        reference: ref,
        status: 'pending',
        customerId: custId,
        customerData: { fullName: c.fullName, phone: c.phone, email: c.email },
        journeyData: { pickupPostcode, dropoffPostcode, bookingType, date, time, passengers, notes, stops: normalizedStops } as unknown as Prisma.InputJsonValue,
        vehicleCategory,
        estimatedMiles: miles,
        estimatedFare: calc.total,
        couponCode,
        discountAmount: calc.discount,
      },
    });

    // Increment customer booking count
    await prisma.customer.update({
      where: { id: custId },
      data: { totalBookings: { increment: 1 } },
    });

    // Auto-create operational job
    const categoryTypeMap: Record<string, VehicleType> = {
      prestige: 'Executive', minibus: 'Minibus', coaches: 'Coach', taxi: 'Saloon',
    };
    const jobDateTime = (date && time) ? new Date(`${date}T${time}:00Z`) : new Date(Date.now() + 30 * 60 * 1000);
    const { commission, affiliatePayout, driverPayout } = applyCommission(calc.total, pricing);

    const jobRow = await prisma.job.create({
      data: {
        id: `job-${uuid()}`,
        bookingRef: ref,
        bookingId: bookingRow.id,
        customerId: custId,
        customerName: c.fullName,
        customerPhone: c.phone,
        customerEmail: c.email,
        pickupAddress: pickupPostcode,
        dropoffAddress: dropoffPostcode,
        stops: stopsJson,
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
      },
    });

    // Link job to booking
    await prisma.booking.update({
      where: { id: bookingRow.id },
      data: { jobId: jobRow.id },
    });

    // Notify only affiliates with matching vehicle category + dispatch to independent drivers
    const matchingAffiliates = await prisma.affiliate.findMany({
      where: {
        isApproved: true,
        fleetVehicles: { some: { vehicleCategory, isApproved: true, approvalStatus: 'approved', status: 'available' } },
      },
      select: { id: true },
    });
    const notifTitle = 'New Job Available';
    const notifBody  = `Job ${ref} — ${pickupPostcode} → ${dropoffPostcode} — payout £${affiliatePayout}`;
    await Promise.all([
      ...matchingAffiliates.map(a => pushNotification(a.id, 'affiliate', notifTitle, notifBody, 'job')),
      pushNotification('admin-1', 'admin', 'New Booking', `${c.fullName} booked ${ref} — £${calc.total}`, 'booking'),
      createIndependentRideOffers(jobRow.id),
      sendTransactionalEmail({
        to: c.email,
        ...bookingConfirmationEmail({
          reference: ref,
          customerName: c.fullName,
          pickup: pickupPostcode,
          dropoff: dropoffPostcode,
          fare: calc.total,
          dateTime: jobDateTime,
        }),
      }),
      sendSms(c.phone, bookingConfirmationSms({ reference: ref, pickup: pickupPostcode, dropoff: dropoffPostcode, fare: calc.total })),
      process.env.OPERATIONS_EMAIL
        ? sendTransactionalEmail({
          to: process.env.OPERATIONS_EMAIL,
          subject: `New Ride Prestige booking: ${ref}`,
          text: `New booking ${ref} from ${c.fullName}\n${pickupPostcode} -> ${dropoffPostcode}\nFare: £${calc.total}`,
        })
        : Promise.resolve(false),
    ]);

    const booking = shapeBooking({ ...bookingRow, jobId: jobRow.id });
    const job = shapeJob(jobRow);

    const payment = isStripeConfigured()
      ? await createCheckoutSession({
        bookingId: bookingRow.id,
        jobId: jobRow.id,
        bookingRef: ref,
        amount: calc.total,
        customerEmail: c.email,
        customerName: c.fullName,
      }).catch(error => {
        console.error('Stripe checkout session creation failed:', error);
        return null;
      })
      : null;

    res.status(201).json({ success: true, data: booking, job, calculation: calc, payment });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
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
router.put('/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const custId = getCustId(req);
    const row = await prisma.booking.findFirst({ where: { id: req.params.id, customerId: custId } });
    if (!row) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    if (['completed', 'cancelled'].includes(row.status)) {
      res.status(409).json({ success: false, message: `Cannot cancel a booking in status: ${row.status}` }); return;
    }
    const updated = await prisma.booking.update({
      where: { id: row.id },
      data: { status: 'cancelled' },
    });
    // Also cancel the linked job
    if (updated.jobId) {
      const job = await prisma.job.findUnique({ where: { id: updated.jobId } });
      if (job && !['completed', 'cancelled'].includes(job.status)) {
        await prisma.job.update({ where: { id: job.id }, data: { status: 'cancelled' } });
        if (job.affiliateId) {
          await pushNotification(job.affiliateId, 'affiliate', 'Job Cancelled', `Job ${job.bookingRef} has been cancelled by the customer.`, 'job');
        }
      }
    }
    res.json({ success: true, message: 'Booking cancelled', data: shapeBooking(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
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
router.get('/bookings/:id/track', async (req: Request, res: Response) => {
  try {
    const custId = getCustId(req);
    const row = await prisma.booking.findFirst({ where: { id: req.params.id, customerId: custId } });
    if (!row) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    const b = shapeBooking(row);
    if (!b.jobId) {
      res.json({ success: true, data: { bookingStatus: b.status, jobStatus: null, driver: null } }); return;
    }
    const job = await prisma.job.findUnique({ where: { id: b.jobId } });
    if (!job) {
      res.json({ success: true, data: { bookingStatus: b.status, jobStatus: null, driver: null } }); return;
    }
    const driver = job.assignedDriverId
      ? await prisma.driver.findUnique({ where: { id: job.assignedDriverId } })
      : null;
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
          lastLocationUpdate: driver.lastLocationUpdate?.toISOString() ?? null,
        } : null,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
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
router.post('/bookings/:id/rate', async (req: Request, res: Response) => {
  try {
    const custId = getCustId(req);
    const row = await prisma.booking.findFirst({ where: { id: req.params.id, customerId: custId } });
    if (!row) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    const b = shapeBooking(row);
    const job = b.jobId
      ? await prisma.job.findFirst({ where: { id: b.jobId, status: 'completed' } })
      : null;
    if (!job) {
      res.status(400).json({ success: false, message: 'Can only rate a completed ride' }); return;
    }
    if (job.customerRating) {
      res.status(409).json({ success: false, message: 'You have already rated this ride' }); return;
    }
    const { rating, feedback, review } = req.body as { rating: number; feedback?: string; review?: string };
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' }); return;
    }
    await prisma.job.update({
      where: { id: job.id },
      data: {
        customerRating: rating,
        customerFeedback: (feedback ?? review)?.trim().slice(0, 1000) || null,
      },
    });
    // Recalculate the driver's customer-facing average from all rated rides.
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
    res.json({ success: true, message: 'Thank you for rating your ride!' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ─── Push Token ───────────────────────────────────────────────────────────────

router.put('/push-token', async (req: Request, res: Response) => {
  try {
    const custId = getCustId(req);
    const { token } = req.body as { token?: string };
    if (!token) { res.status(400).json({ success: false, message: 'Token required' }); return; }
    await prisma.customer.update({ where: { id: custId }, data: { expoPushToken: token } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

export default router;
