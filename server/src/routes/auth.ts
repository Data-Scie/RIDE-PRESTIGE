import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { admins, customers, drivers, affiliates } from '../data/store';
import { signToken, authenticate } from '../middleware/auth';
import type { Customer, Driver, Affiliate } from '../types';

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
router.post('/login', (req: Request, res: Response): void => {
  const { email, password, role } = req.body as { email: string; password: string; role: string };
  if (!email || !password || !role) {
    res.status(400).json({ success: false, message: 'email, password and role are required' });
    return;
  }

  if (role === 'admin' || role === 'ops') {
    const admin = admins.find(a => a.email === email);
    if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const token = signToken({ id: admin.id, email: admin.email, role: admin.role === 'ops' ? 'ops' : 'admin' });
    res.json({ success: true, token, user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
    return;
  }

  if (role === 'affiliate') {
    const aff = affiliates.find(a => a.email === email);
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
    const drv = drivers.find(d => d.email === email);
    if (!drv || !bcrypt.compareSync(password, drv.passwordHash)) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    if (!drv.isApproved) {
      res.status(403).json({ success: false, message: 'Your account is pending approval' });
      return;
    }
    const token = signToken({ id: drv.id, email: drv.email, role: 'driver', affiliateId: drv.affiliateId });
    const { passwordHash: _, ...safe } = drv;
    res.json({ success: true, token, user: safe });
    return;
  }

  if (role === 'customer') {
    const cust = customers.find(c => c.email === email);
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
router.post('/register/customer', (req: Request, res: Response): void => {
  const { fullName, email, phone, password } = req.body as Customer & { password: string };
  if (!fullName || !email || !phone || !password) {
    res.status(400).json({ success: false, message: 'fullName, email, phone, and password are required' });
    return;
  }
  if (customers.find(c => c.email === email)) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }
  const newCust: Customer = {
    id: `cust-${uuid()}`,
    fullName, email, phone,
    passwordHash: bcrypt.hashSync(password, 10),
    isVerified: false,
    totalBookings: 0,
    createdAt: new Date().toISOString(),
  };
  customers.push(newCust);
  const token = signToken({ id: newCust.id, email: newCust.email, role: 'customer' });
  const { passwordHash: _, ...safe } = newCust;
  res.status(201).json({ success: true, token, user: safe });
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
router.post('/register/driver', (req: Request, res: Response): void => {
  const b = req.body as Driver & { password: string };
  if (!b.fullName || !b.email || !b.phone || !b.password || !b.drivingLicenceNumber || !b.privateHireBadgeNumber) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }
  if (drivers.find(d => d.email === b.email)) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }
  const newDriver: Driver = {
    id: `drv-${uuid()}`,
    fullName: b.fullName, email: b.email, phone: b.phone,
    passwordHash: bcrypt.hashSync(b.password, 10),
    address: b.address ?? '', city: b.city ?? '', postcode: b.postcode ?? '',
    dateOfBirth: b.dateOfBirth ?? '', drivingLicenceNumber: b.drivingLicenceNumber,
    privateHireBadgeNumber: b.privateHireBadgeNumber, nationalInsurance: b.nationalInsurance,
    driverType: b.driverType ?? 'independentDriver',
    affiliateId: b.affiliateId,
    status: 'offline',
    rating: 0, totalJobs: 0, totalEarnings: 0,
    documentsStatus: 'missing',
    documents: [
      { id: uuid(), type: 'driving_licence',  label: 'Driving Licence',        status: 'missing' },
      { id: uuid(), type: 'phv_badge',        label: 'PHV Badge',              status: 'missing' },
      { id: uuid(), type: 'dbs_check',        label: 'DBS Check',              status: 'missing' },
      { id: uuid(), type: 'insurance',        label: 'Insurance Certificate',  status: 'missing' },
    ],
    isApproved: false,
    joinedDate: new Date().toISOString(),
  };
  drivers.push(newDriver);
  const { passwordHash: _, ...safe } = newDriver;
  res.status(201).json({ success: true, message: 'Driver registered. Pending admin approval.', user: safe });
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
router.post('/register/affiliate', (req: Request, res: Response): void => {
  const b = req.body as Affiliate & { password: string };
  if (!b.companyName || !b.email || !b.phone || !b.password || !b.operatorLicenceNumber || !b.companyRegNumber) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }
  if (affiliates.find(a => a.email === b.email)) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }
  const newAff: Affiliate = {
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
    createdAt: new Date().toISOString(),
  };
  affiliates.push(newAff);
  const { passwordHash: _, ...safe } = newAff;
  res.status(201).json({ success: true, message: 'Affiliate registered. Pending admin approval.', affiliate: safe });
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
router.get('/me', authenticate, (req: Request, res: Response): void => {
  const u = req.user!;
  let profile: Record<string, unknown> | undefined;

  if (u.role === 'admin' || u.role === 'ops') {
    const a = admins.find(x => x.id === u.id);
    if (a) { const { passwordHash: _, ...s } = a; profile = s; }
  } else if (u.role === 'affiliate') {
    const a = affiliates.find(x => x.id === u.id);
    if (a) { const { passwordHash: _, ...s } = a; profile = s; }
  } else if (u.role === 'driver') {
    const d = drivers.find(x => x.id === u.id);
    if (d) { const { passwordHash: _, ...s } = d; profile = s; }
  } else if (u.role === 'customer') {
    const c = customers.find(x => x.id === u.id);
    if (c) { const { passwordHash: _, ...s } = c; profile = s; }
  }

  res.json({ success: true, user: profile ?? u });
});

export default router;
