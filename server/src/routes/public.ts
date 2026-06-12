import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  websiteVehicles, websiteFleetCategories, pricingConfig, cancellationPolicy,
  siteSettings, navigation, promotions, faqItems, bookings, quotes, supportTickets,
} from '../data/store';
import { estimateDistance, estimateHours, calculateFare, applyCommission } from '../services/fareService';
import { pushNotification } from '../services/notificationService';
import type { Booking, QuoteResult, SupportTicket, VehicleCategory, BookingType } from '../types';

const router = Router();

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
router.get('/site-settings', (_req: Request, res: Response) => {
  res.json({ success: true, data: siteSettings });
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
router.get('/navigation', (_req: Request, res: Response) => {
  res.json({ success: true, data: navigation.filter(n => n.visible).sort((a, b) => a.order - b.order) });
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
router.get('/fleet/categories', (_req: Request, res: Response) => {
  res.json({ success: true, data: websiteFleetCategories.filter(c => c.available).sort((a, b) => a.order - b.order) });
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
router.get('/fleet', (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };
  let vehicles = websiteVehicles.filter(v => v.available);
  if (category) vehicles = vehicles.filter(v => v.categorySlug === category);
  res.json({ success: true, data: vehicles, total: vehicles.length });
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
router.get('/fleet/:id', (req: Request, res: Response) => {
  const v = websiteVehicles.find(x => x.id === req.params.id);
  if (!v) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
  res.json({ success: true, data: v });
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
router.get('/pricing', (_req: Request, res: Response) => {
  res.json({ success: true, data: { pricing: pricingConfig, cancellationPolicy } });
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
router.get('/promotions', (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  const active = promotions.filter(p => p.active && p.startDate <= today && p.endDate >= today);
  res.json({ success: true, data: active });
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
router.get('/faqs', (_req: Request, res: Response) => {
  const active = faqItems.filter(f => f.active).sort((a, b) => a.order - b.order);
  res.json({ success: true, data: active });
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

  const quote: QuoteResult = {
    id: quoteId,
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
router.post('/booking', (req: Request, res: Response) => {
  const { fullName, phone, email, pickupPostcode, dropoffPostcode, vehicleCategory, passengers,
          bookingType, date, time, notes, couponCode, quoteId } = req.body as {
    fullName: string; phone: string; email: string;
    pickupPostcode: string; dropoffPostcode: string; vehicleCategory: VehicleCategory;
    passengers: number; bookingType: BookingType; date?: string; time?: string;
    notes?: string; couponCode?: string; quoteId?: string;
  };

  if (!fullName || !phone || !email || !pickupPostcode || !dropoffPostcode || !vehicleCategory || !passengers || !bookingType) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }

  const miles = estimateDistance(pickupPostcode, dropoffPostcode);
  const hours = estimateHours(miles);
  const calc  = calculateFare(vehicleCategory, miles, hours, passengers, couponCode);
  const { commission, affiliatePayout, driverPayout } = applyCommission(calc.total);

  const ref = `RP-${new Date().getFullYear()}-${String(bookings.length + 1001).padStart(4, '0')}`;
  const n = new Date().toISOString();

  const booking: Booking = {
    id: `bk-${uuid()}`,
    reference: ref,
    status: 'pending',
    createdAt: n,
    updatedAt: n,
    customer: { fullName, phone, email },
    journey: { pickupPostcode, dropoffPostcode, bookingType, date, time, passengers, notes },
    vehicleCategory,
    estimatedMiles: miles,
    estimatedFare: calc.total,
    couponCode,
    discountAmount: calc.discount,
  };
  bookings.push(booking);

  // Notify admin
  pushNotification('admin-1', 'admin', 'New Booking', `New booking ${ref} from ${fullName} — £${calc.total}`, 'booking');

  // Resolve quote if linked
  if (quoteId) {
    const q = quotes.find(x => x.id === quoteId);
    if (q) q.status = 'accepted';
  }

  res.status(201).json({ success: true, data: { booking, quote: { calculation: calc, commission, affiliatePayout, driverPayout } } });
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
router.get('/booking/:reference', (req: Request, res: Response) => {
  const b = bookings.find(x => x.reference === req.params.reference);
  if (!b) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
  res.json({ success: true, data: b });
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
router.post('/contact', (req: Request, res: Response) => {
  const { name, email, phone, subject, message, bookingReference, type } = req.body as {
    name: string; email: string; phone?: string; subject: string; message: string; bookingReference?: string; type?: SupportTicket['type'];
  };
  if (!name || !email || !subject || !message) {
    res.status(400).json({ success: false, message: 'name, email, subject, and message are required' });
    return;
  }
  const ref = `TK-${String(supportTickets.length + 1).padStart(3, '0')}`;
  const n = new Date().toISOString();
  const ticket: SupportTicket = {
    id: `tk-${uuid()}`,
    reference: ref,
    type: type ?? 'enquiry',
    status: 'open',
    createdAt: n,
    updatedAt: n,
    customer: { name, email, phone },
    bookingReference,
    subject,
    message,
  };
  supportTickets.push(ticket);
  pushNotification('admin-1', 'admin', 'New Support Ticket', `New ticket ${ref} from ${name}: ${subject}`, 'system');
  res.status(201).json({ success: true, message: `Ticket submitted. Reference: ${ref}`, data: { reference: ref } });
});

export default router;
