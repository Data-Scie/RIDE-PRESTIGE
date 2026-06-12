import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate, requireRole } from '../middleware/auth';
import {
  customers, drivers, affiliates, fleetVehicles, websiteVehicles, websiteFleetCategories,
  bookings, jobs, earnings, notifications, supportTickets, siteSettings as settingsStore,
  pricingConfig as pricingStore, promotions, faqItems, navigation,
} from '../data/store';
import type { WebsiteVehicle, Promotion, FAQItem, NavigationItem, SupportTicket } from '../types';

const router = Router();
router.use(authenticate, requireRole('admin', 'ops'));

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Dashboard stats }
 */
router.get('/dashboard', (_req: Request, res: Response) => {
  const totalRevenue = earnings.reduce((s, e) => s + e.grossAmount, 0);
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  res.json({
    success: true,
    data: {
      totalBookings:      bookings.length,
      pendingBookings:    bookings.filter(b => b.status === 'pending').length,
      completedJobs,
      activeJobs:         jobs.filter(j => !['completed','cancelled','rejected'].includes(j.status)).length,
      totalCustomers:     customers.length,
      totalDrivers:       drivers.length,
      approvedDrivers:    drivers.filter(d => d.isApproved).length,
      totalAffiliates:    affiliates.length,
      approvedAffiliates: affiliates.filter(a => a.isApproved).length,
      totalRevenue:       parseFloat(totalRevenue.toFixed(2)),
      pendingTickets:     supportTickets.filter(t => t.status === 'open').length,
      fleetVehicles:      fleetVehicles.length,
    },
  });
});

// ─── Bookings ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: List all bookings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: number }
 *       - in: query
 *         name: limit
 *         schema: { type: number }
 *     responses:
 *       200: { description: Bookings list }
 */
router.get('/bookings', (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
  let result = [...bookings];
  if (status) result = result.filter(b => b.status === status);
  result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const p = parseInt(page); const l = parseInt(limit);
  const total = result.length;
  const data  = result.slice((p - 1) * l, p * l);
  res.json({ success: true, data, total, page: p, limit: l, pages: Math.ceil(total / l) });
});

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   get:
 *     summary: Get a single booking
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking }
 *       404: { description: Not found }
 */
router.get('/bookings/:id', (req: Request, res: Response) => {
  const b = bookings.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
  const linkedJob = b.jobId ? jobs.find(j => j.id === b.jobId) : null;
  res.json({ success: true, data: b, job: linkedJob ?? null });
});

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   put:
 *     summary: Update booking status or admin notes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:     { type: string, enum: [pending, quoted, accepted, rejected, completed, cancelled] }
 *               adminNotes: { type: string }
 *     responses:
 *       200: { description: Updated booking }
 */
router.put('/bookings/:id', (req: Request, res: Response) => {
  const b = bookings.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
  const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };
  if (status) b.status = status as typeof b.status;
  if (adminNotes !== undefined) b.adminNotes = adminNotes;
  b.updatedAt = new Date().toISOString();
  res.json({ success: true, data: b });
});

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   delete:
 *     summary: Cancel / delete a booking
 *     tags: [Admin]
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
router.delete('/bookings/:id', (req: Request, res: Response) => {
  const b = bookings.find(x => x.id === req.params.id);
  if (!b) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
  b.status = 'cancelled';
  b.updatedAt = new Date().toISOString();
  res.json({ success: true, message: 'Booking cancelled' });
});

// ─── Website Fleet (CMS) ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/fleet:
 *   get:
 *     summary: List all CMS fleet vehicles
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Website fleet vehicles }
 */
router.get('/fleet', (_req: Request, res: Response) => {
  res.json({ success: true, data: websiteVehicles, categories: websiteFleetCategories });
});

/**
 * @swagger
 * /api/admin/fleet:
 *   post:
 *     summary: Add a new CMS fleet vehicle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categorySlug, name, description, passengers, features, imageUrl]
 *             properties:
 *               categorySlug: { type: string, enum: [prestige, minibus, coaches, taxi] }
 *               name:         { type: string }
 *               description:  { type: string }
 *               passengers:   { type: number }
 *               luggage:      { type: string }
 *               features:     { type: array, items: { type: string } }
 *               imageUrl:     { type: string }
 *               badge:        { type: string }
 *               available:    { type: boolean }
 *     responses:
 *       201: { description: Vehicle created }
 */
router.post('/fleet', (req: Request, res: Response) => {
  const b = req.body as Omit<WebsiteVehicle, 'id'>;
  if (!b.name || !b.categorySlug || !b.description || !b.passengers || !b.imageUrl) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }
  const v: WebsiteVehicle = { ...b, id: `wv-${uuid()}`, available: b.available !== false };
  websiteVehicles.push(v);
  res.status(201).json({ success: true, data: v });
});

/**
 * @swagger
 * /api/admin/fleet/{id}:
 *   put:
 *     summary: Update a CMS fleet vehicle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated vehicle }
 */
router.put('/fleet/:id', (req: Request, res: Response) => {
  const idx = websiteVehicles.findIndex(x => x.id === req.params.id);
  if (idx === -1) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
  websiteVehicles[idx] = { ...websiteVehicles[idx], ...req.body, id: req.params.id };
  res.json({ success: true, data: websiteVehicles[idx] });
});

/**
 * @swagger
 * /api/admin/fleet/{id}:
 *   delete:
 *     summary: Delete a CMS fleet vehicle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/fleet/:id', (req: Request, res: Response) => {
  const idx = websiteVehicles.findIndex(x => x.id === req.params.id);
  if (idx === -1) { res.status(404).json({ success: false, message: 'Vehicle not found' }); return; }
  websiteVehicles.splice(idx, 1);
  res.json({ success: true, message: 'Vehicle deleted' });
});

// ─── Drivers ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/drivers:
 *   get:
 *     summary: List all drivers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: approved
 *         schema: { type: string, enum: [true, false] }
 *     responses:
 *       200: { description: Drivers list }
 */
router.get('/drivers', (req: Request, res: Response) => {
  const { approved } = req.query as { approved?: string };
  let list = drivers.map(({ passwordHash: _, ...d }) => d);
  if (approved !== undefined) list = list.filter(d => d.isApproved === (approved === 'true'));
  res.json({ success: true, data: list, total: list.length });
});

/**
 * @swagger
 * /api/admin/drivers/{id}:
 *   get:
 *     summary: Get a driver by ID
 *     tags: [Admin]
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
  res.json({ success: true, data: safe });
});

/**
 * @swagger
 * /api/admin/drivers/{id}/approve:
 *   put:
 *     summary: Approve or reject a driver
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approve: { type: boolean }
 *     responses:
 *       200: { description: Driver approval updated }
 */
router.put('/drivers/:id/approve', (req: Request, res: Response) => {
  const d = drivers.find(x => x.id === req.params.id);
  if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  const { approve } = req.body as { approve: boolean };
  d.isApproved = approve;
  const { passwordHash: _, ...safe } = d;
  res.json({ success: true, message: `Driver ${approve ? 'approved' : 'rejected'}`, data: safe });
});

/**
 * @swagger
 * /api/admin/drivers/{id}/documents/{docId}:
 *   put:
 *     summary: Update a driver document status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:          { type: string, enum: [approved, pending, rejected, expired, missing] }
 *               rejectionReason: { type: string }
 *               expiryDate:      { type: string }
 *     responses:
 *       200: { description: Document updated }
 */
router.put('/drivers/:id/documents/:docId', (req: Request, res: Response) => {
  const d = drivers.find(x => x.id === req.params.id);
  if (!d) { res.status(404).json({ success: false, message: 'Driver not found' }); return; }
  const doc = d.documents.find(x => x.id === req.params.docId);
  if (!doc) { res.status(404).json({ success: false, message: 'Document not found' }); return; }
  const { status, rejectionReason, expiryDate } = req.body as { status?: string; rejectionReason?: string; expiryDate?: string };
  if (status) doc.status = status as typeof doc.status;
  if (rejectionReason) doc.rejectionReason = rejectionReason;
  if (expiryDate) doc.expiryDate = expiryDate;
  const allApproved = d.documents.every(x => x.status === 'approved');
  d.documentsStatus = allApproved ? 'approved' : d.documents.some(x => x.status === 'rejected') ? 'rejected' : 'pending';
  res.json({ success: true, data: doc });
});

// ─── Affiliates ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/affiliates:
 *   get:
 *     summary: List all affiliates
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Affiliates list }
 */
router.get('/affiliates', (_req: Request, res: Response) => {
  const list = affiliates.map(({ passwordHash: _, ...a }) => a);
  res.json({ success: true, data: list, total: list.length });
});

/**
 * @swagger
 * /api/admin/affiliates/{id}/approve:
 *   put:
 *     summary: Approve or reject an affiliate
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approve: { type: boolean }
 *     responses:
 *       200: { description: Affiliate approval updated }
 */
router.put('/affiliates/:id/approve', (req: Request, res: Response) => {
  const a = affiliates.find(x => x.id === req.params.id);
  if (!a) { res.status(404).json({ success: false, message: 'Affiliate not found' }); return; }
  a.isApproved = req.body.approve;
  const { passwordHash: _, ...safe } = a;
  res.json({ success: true, message: `Affiliate ${req.body.approve ? 'approved' : 'rejected'}`, data: safe });
});

// ─── Customers ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/customers:
 *   get:
 *     summary: List all customers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Customers list }
 */
router.get('/customers', (_req: Request, res: Response) => {
  const list = customers.map(({ passwordHash: _, ...c }) => c);
  res.json({ success: true, data: list, total: list.length });
});

// ─── Support Tickets ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/support:
 *   get:
 *     summary: List all support tickets
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, in_progress, resolved] }
 *     responses:
 *       200: { description: Tickets }
 */
router.get('/support', (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };
  let list = [...supportTickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (status) list = list.filter(t => t.status === status);
  res.json({ success: true, data: list, total: list.length });
});

/**
 * @swagger
 * /api/admin/support/{id}:
 *   put:
 *     summary: Update a support ticket
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:     { type: string, enum: [open, in_progress, resolved] }
 *               adminNotes: { type: string }
 *               reply:      { type: string }
 *     responses:
 *       200: { description: Ticket updated }
 */
router.put('/support/:id', (req: Request, res: Response) => {
  const t = supportTickets.find(x => x.id === req.params.id);
  if (!t) { res.status(404).json({ success: false, message: 'Ticket not found' }); return; }
  const { status, adminNotes, reply } = req.body as { status?: SupportTicket['status']; adminNotes?: string; reply?: string };
  if (status) t.status = status;
  if (adminNotes !== undefined) t.adminNotes = adminNotes;
  if (reply !== undefined) t.reply = reply;
  t.updatedAt = new Date().toISOString();
  res.json({ success: true, data: t });
});

// ─── Pricing ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/pricing:
 *   get:
 *     summary: Get pricing configuration
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Pricing config }
 */
router.get('/pricing', (_req: Request, res: Response) => {
  res.json({ success: true, data: pricingStore });
});

/**
 * @swagger
 * /api/admin/pricing:
 *   put:
 *     summary: Update pricing configuration
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Updated pricing }
 */
router.put('/pricing', (req: Request, res: Response) => {
  Object.assign(pricingStore, req.body);
  res.json({ success: true, data: pricingStore });
});

// ─── Site Settings ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get site settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Site settings }
 */
router.get('/settings', (_req: Request, res: Response) => {
  res.json({ success: true, data: settingsStore });
});

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update site settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Updated settings }
 */
router.put('/settings', (req: Request, res: Response) => {
  Object.assign(settingsStore, req.body);
  res.json({ success: true, data: settingsStore });
});

// ─── Promotions ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/promotions:
 *   get:
 *     summary: List all promotions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Promotions }
 */
router.get('/promotions', (_req: Request, res: Response) => {
  res.json({ success: true, data: promotions });
});

/**
 * @swagger
 * /api/admin/promotions:
 *   post:
 *     summary: Create a promotion
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, discountType, discountValue, startDate, endDate, terms]
 *             properties:
 *               title:         { type: string }
 *               description:   { type: string }
 *               couponCode:    { type: string }
 *               discountType:  { type: string, enum: [percentage, fixed] }
 *               discountValue: { type: number }
 *               startDate:     { type: string }
 *               endDate:       { type: string }
 *               active:        { type: boolean }
 *               terms:         { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/promotions', (req: Request, res: Response) => {
  const { active: rawActive, ...rest } = req.body as Omit<Promotion, 'id'>;
  const p: Promotion = { ...rest, id: `promo-${uuid()}`, active: rawActive !== false };
  promotions.push(p);
  res.status(201).json({ success: true, data: p });
});

/**
 * @swagger
 * /api/admin/promotions/{id}:
 *   put:
 *     summary: Update a promotion
 *     tags: [Admin]
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
router.put('/promotions/:id', (req: Request, res: Response) => {
  const idx = promotions.findIndex(x => x.id === req.params.id);
  if (idx === -1) { res.status(404).json({ success: false, message: 'Promotion not found' }); return; }
  promotions[idx] = { ...promotions[idx], ...req.body, id: req.params.id };
  res.json({ success: true, data: promotions[idx] });
});

/**
 * @swagger
 * /api/admin/promotions/{id}:
 *   delete:
 *     summary: Delete a promotion
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/promotions/:id', (req: Request, res: Response) => {
  const idx = promotions.findIndex(x => x.id === req.params.id);
  if (idx === -1) { res.status(404).json({ success: false, message: 'Not found' }); return; }
  promotions.splice(idx, 1);
  res.json({ success: true, message: 'Promotion deleted' });
});

// ─── FAQs ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/faqs:
 *   get:
 *     summary: List all FAQs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: FAQs }
 */
router.get('/faqs', (_req: Request, res: Response) => {
  res.json({ success: true, data: faqItems });
});

/**
 * @swagger
 * /api/admin/faqs:
 *   post:
 *     summary: Create a FAQ
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer, category]
 *             properties:
 *               question: { type: string }
 *               answer:   { type: string }
 *               category: { type: string }
 *               order:    { type: number }
 *               active:   { type: boolean }
 *     responses:
 *       201: { description: Created }
 */
router.post('/faqs', (req: Request, res: Response) => {
  const { active: rawActive, order: rawOrder, ...rest } = req.body as Omit<FAQItem, 'id'>;
  const f: FAQItem = { ...rest, id: `faq-${uuid()}`, active: rawActive !== false, order: rawOrder ?? (faqItems.length + 1) };
  faqItems.push(f);
  res.status(201).json({ success: true, data: f });
});

/**
 * @swagger
 * /api/admin/faqs/{id}:
 *   put:
 *     summary: Update a FAQ
 *     tags: [Admin]
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
router.put('/faqs/:id', (req: Request, res: Response) => {
  const idx = faqItems.findIndex(x => x.id === req.params.id);
  if (idx === -1) { res.status(404).json({ success: false, message: 'FAQ not found' }); return; }
  faqItems[idx] = { ...faqItems[idx], ...req.body, id: req.params.id };
  res.json({ success: true, data: faqItems[idx] });
});

/**
 * @swagger
 * /api/admin/faqs/{id}:
 *   delete:
 *     summary: Delete a FAQ
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/faqs/:id', (req: Request, res: Response) => {
  const idx = faqItems.findIndex(x => x.id === req.params.id);
  if (idx === -1) { res.status(404).json({ success: false, message: 'Not found' }); return; }
  faqItems.splice(idx, 1);
  res.json({ success: true, message: 'FAQ deleted' });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/navigation:
 *   get:
 *     summary: List navigation items
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Navigation items }
 */
router.get('/navigation', (_req: Request, res: Response) => {
  res.json({ success: true, data: navigation });
});

/**
 * @swagger
 * /api/admin/navigation:
 *   put:
 *     summary: Replace entire navigation array
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:      { type: string }
 *                     label:   { type: string }
 *                     href:    { type: string }
 *                     visible: { type: boolean }
 *                     order:   { type: number }
 *     responses:
 *       200: { description: Updated navigation }
 */
router.put('/navigation', (req: Request, res: Response) => {
  const { items } = req.body as { items: NavigationItem[] };
  if (!Array.isArray(items)) { res.status(400).json({ success: false, message: 'items array required' }); return; }
  navigation.length = 0;
  items.forEach(i => navigation.push(i));
  res.json({ success: true, data: navigation });
});

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Get admin notifications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Notifications }
 */
router.get('/notifications', (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const list = notifications.filter(n => n.recipientId === adminId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ success: true, data: list, unread: list.filter(n => !n.isRead).length });
});

export default router;
