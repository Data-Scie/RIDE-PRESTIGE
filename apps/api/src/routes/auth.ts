import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/db';
import { signToken, authenticate } from '../middleware/auth';
import type { PortalRole } from '../types';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login for all portal roles
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email:    { type: string, example: "admin@rideprestige.co.uk" }
 *               password: { type: string, example: "Admin@2026!" }
 *               role:     { type: string, enum: [admin, ops, affiliate, driver, customer], example: "admin" }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password, role } = req.body as { email: string; password: string; role: string };
  if (!email || !password || !role) {
    res.status(400).json({ success: false, message: 'email, password and role are required' });
    return;
  }

  try {
    if (role === 'admin' || role === 'ops') {
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      const tokenRole: PortalRole = admin.role === 'ops' ? 'ops' : 'admin';
      const token = signToken({ id: admin.id, email: admin.email, role: tokenRole });
      res.json({ success: true, token, user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
      return;
    }

    if (role === 'affiliate') {
      const aff = await prisma.affiliate.findUnique({ where: { email } });
      if (!aff || !bcrypt.compareSync(password, aff.passwordHash)) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      if (!aff.isApproved) {
        res.status(403).json({ success: false, message: 'Your account is pending approval' });
        return;
      }
      const token = signToken({ id: aff.id, email: aff.email, role: 'affiliate', affiliateId: aff.id });
      const { passwordHash: _, ...safe } = aff;
      res.json({ success: true, token, user: safe });
      return;
    }

    if (role === 'driver') {
      const drv = await prisma.driver.findUnique({ where: { email }, include: { documents: true } });
      if (!drv || !bcrypt.compareSync(password, drv.passwordHash)) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      if (!drv.isApproved) {
        res.status(403).json({ success: false, message: 'Your account is pending approval' });
        return;
      }
      const token = signToken({ id: drv.id, email: drv.email, role: 'driver', affiliateId: drv.affiliateId ?? undefined });
      const { passwordHash: _, ...safe } = drv;
      res.json({ success: true, token, user: safe });
      return;
    }

    if (role === 'customer') {
      const cust = await prisma.customer.findUnique({ where: { email } });
      if (!cust || !bcrypt.compareSync(password, cust.passwordHash)) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      const token = signToken({ id: cust.id, email: cust.email, role: 'customer' });
      const { passwordHash: _, ...safe } = cust;
      res.json({ success: true, token, user: safe });
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid role' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/auth/register/customer:
 *   post:
 *     summary: Register a new customer
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, phone, password]
 *             properties:
 *               fullName: { type: string, example: "John Smith" }
 *               email:    { type: string, example: "john@example.com" }
 *               phone:    { type: string, example: "+44 7700 900999" }
 *               password: { type: string, example: "MyPass@123" }
 *     responses:
 *       201: { description: Customer created }
 *       409: { description: Email already exists }
 */
router.post('/register/customer', async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, phone, password } = req.body as { fullName: string; email: string; phone: string; password: string };
  if (!fullName || !email || !phone || !password) {
    res.status(400).json({ success: false, message: 'fullName, email, phone, and password are required' });
    return;
  }
  try {
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }
    const newCust = await prisma.customer.create({
      data: {
        id: `cust-${uuid()}`,
        fullName, email, phone,
        passwordHash: bcrypt.hashSync(password, 10),
        isVerified: false,
        totalBookings: 0,
      },
    });
    const token = signToken({ id: newCust.id, email: newCust.email, role: 'customer' });
    const { passwordHash: _, ...safe } = newCust;
    res.status(201).json({ success: true, token, user: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/auth/register/driver:
 *   post:
 *     summary: Register a new driver
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, phone, password, address, city, postcode, dateOfBirth, drivingLicenceNumber, privateHireBadgeNumber, driverType]
 *             properties:
 *               fullName:                { type: string }
 *               email:                   { type: string }
 *               phone:                   { type: string }
 *               password:                { type: string }
 *               address:                 { type: string }
 *               city:                    { type: string }
 *               postcode:                { type: string }
 *               dateOfBirth:             { type: string }
 *               drivingLicenceNumber:    { type: string }
 *               privateHireBadgeNumber:  { type: string }
 *               driverType:              { type: string, enum: [affiliateDriver, independentDriver] }
 *               affiliateId:             { type: string }
 *     responses:
 *       201: { description: Driver registered, pending approval }
 *       409: { description: Email already exists }
 */
router.post('/register/driver', async (req: Request, res: Response): Promise<void> => {
  const b = req.body as {
    fullName: string; email: string; phone: string; password: string;
    address?: string; city?: string; postcode?: string; dateOfBirth?: string;
    drivingLicenceNumber: string; privateHireBadgeNumber: string; nationalInsurance?: string;
    driverType?: 'affiliateDriver' | 'independentDriver'; affiliateId?: string;
  };
  if (!b.fullName || !b.email || !b.phone || !b.password || !b.drivingLicenceNumber || !b.privateHireBadgeNumber || !b.driverType) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }
  if (!['affiliateDriver', 'independentDriver'].includes(b.driverType)) {
    res.status(400).json({ success: false, message: 'Invalid driver type' });
    return;
  }
  if (b.driverType === 'affiliateDriver' && !b.affiliateId) {
    res.status(400).json({ success: false, message: 'Please select an affiliate company' });
    return;
  }
  try {
    const existing = await prisma.driver.findUnique({ where: { email: b.email } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }
    if (b.driverType === 'affiliateDriver') {
      const affiliate = await prisma.affiliate.findFirst({
        where: { id: b.affiliateId, isApproved: true },
      });
      if (!affiliate) {
        res.status(400).json({ success: false, message: 'Selected affiliate is not available' });
        return;
      }
    }
    const drvId = `drv-${uuid()}`;
    const newDriver = await prisma.driver.create({
      data: {
        id: drvId,
        fullName: b.fullName, email: b.email, phone: b.phone,
        passwordHash: bcrypt.hashSync(b.password, 10),
        address: b.address ?? '', city: b.city ?? '', postcode: b.postcode ?? '',
        dateOfBirth: b.dateOfBirth ?? '', drivingLicenceNumber: b.drivingLicenceNumber,
        privateHireBadgeNumber: b.privateHireBadgeNumber, nationalInsurance: b.nationalInsurance,
        driverType: b.driverType,
        affiliateId: b.driverType === 'affiliateDriver' ? b.affiliateId : null,
        serviceAreas: b.driverType === 'independentDriver' && b.postcode
          ? [b.postcode.trim().toUpperCase().split(/\s+/)[0]]
          : [],
        status: 'offline',
        rating: 0, totalJobs: 0, totalEarnings: 0,
        documentsStatus: 'missing',
        isApproved: false,
        applicationStatus: 'pending',
        documents: {
          create: [
            { id: uuid(), type: 'driving_licence',  label: 'Driving Licence',       status: 'missing' },
            { id: uuid(), type: 'phv_badge',        label: 'PHV Badge',             status: 'missing' },
            { id: uuid(), type: 'dbs_check',        label: 'DBS Check',             status: 'missing' },
            { id: uuid(), type: 'insurance',        label: 'Insurance Certificate', status: 'missing' },
          ],
        },
      },
      include: { documents: true },
    });
    const { passwordHash: _, ...safe } = newDriver;
    res.status(201).json({ success: true, message: 'Driver registered. Pending admin approval.', user: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

/**
 * @swagger
 * /api/auth/register/affiliate:
 *   post:
 *     summary: Register a new affiliate company
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, email, phone, password, operatorLicenceNumber, companyRegNumber]
 *             properties:
 *               companyName:           { type: string }
 *               tradingName:           { type: string }
 *               contactPerson:         { type: string }
 *               email:                 { type: string }
 *               phone:                 { type: string }
 *               password:              { type: string }
 *               address:               { type: string }
 *               city:                  { type: string }
 *               postcode:              { type: string }
 *               operatorLicenceNumber: { type: string }
 *               companyRegNumber:      { type: string }
 *               vatNumber:             { type: string }
 *               serviceAreas:          { type: array, items: { type: string } }
 *               bankAccountName:       { type: string }
 *               sortCode:              { type: string }
 *               accountNumber:         { type: string }
 *     responses:
 *       201: { description: Affiliate registered, pending approval }
 *       409: { description: Email already exists }
 */
router.post('/register/affiliate', async (req: Request, res: Response): Promise<void> => {
  const b = req.body as {
    companyName: string; tradingName?: string; contactPerson?: string;
    email: string; phone: string; password: string;
    address?: string; city?: string; postcode?: string;
    operatorLicenceNumber: string; companyRegNumber: string; vatNumber?: string;
    serviceAreas?: string[];
    bankAccountName?: string; sortCode?: string; accountNumber?: string;
  };
  if (!b.companyName || !b.email || !b.phone || !b.password || !b.operatorLicenceNumber || !b.companyRegNumber) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }
  try {
    const existing = await prisma.affiliate.findUnique({ where: { email: b.email } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }
    const newAff = await prisma.affiliate.create({
      data: {
        id: `aff-${uuid()}`,
        companyName: b.companyName, tradingName: b.tradingName ?? b.companyName,
        contactPerson: b.contactPerson ?? '', email: b.email, phone: b.phone,
        passwordHash: bcrypt.hashSync(b.password, 10),
        address: b.address ?? '', city: b.city ?? '', postcode: b.postcode ?? '',
        operatorLicenceNumber: b.operatorLicenceNumber, companyRegNumber: b.companyRegNumber,
        vatNumber: b.vatNumber,
        serviceAreas: b.serviceAreas ?? [],
        bankAccountName: b.bankAccountName ?? '', sortCode: b.sortCode ?? '', accountNumber: b.accountNumber ?? '',
        isApproved: false,
        rating: 0, totalJobs: 0, totalEarnings: 0,
      },
    });
    const { passwordHash: _, ...safe } = newAff;
    res.status(201).json({ success: true, message: 'Affiliate registered. Pending admin approval.', affiliate: safe });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) {
    res.status(400).json({ success: false, message: 'email is required' });
    return;
  }

  // Keep the response neutral so this endpoint does not reveal registered accounts.
  res.json({
    success: true,
    message: 'If an account exists for that email, password reset instructions will be sent.',
  });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Current user info }
 *       401: { description: Unauthorised }
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  const u = req.user!;
  try {
    let profile: Record<string, unknown> | undefined;

    if (u.role === 'admin' || u.role === 'ops') {
      const a = await prisma.admin.findUnique({ where: { id: u.id } });
      if (a) { const { passwordHash: _, ...s } = a; profile = s as Record<string, unknown>; }
    } else if (u.role === 'affiliate') {
      const a = await prisma.affiliate.findUnique({ where: { id: u.id } });
      if (a) { const { passwordHash: _, ...s } = a; profile = s as Record<string, unknown>; }
    } else if (u.role === 'driver') {
      const d = await prisma.driver.findUnique({ where: { id: u.id }, include: { documents: true } });
      if (d) { const { passwordHash: _, ...s } = d; profile = s as Record<string, unknown>; }
    } else if (u.role === 'customer') {
      const c = await prisma.customer.findUnique({ where: { id: u.id } });
      if (c) { const { passwordHash: _, ...s } = c; profile = s as Record<string, unknown>; }
    }

    res.json({ success: true, user: profile ?? u });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

export default router;
