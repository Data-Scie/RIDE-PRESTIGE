import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

async function main() {
  console.log('Seeding database…');

  // ─── Admins ────────────────────────────────────────────────────────────────

  await prisma.admin.upsert({
    where: { id: 'admin-1' },
    update: {},
    create: {
      id: 'admin-1',
      email: 'admin@rideprestige.co.uk',
      passwordHash: hash('Admin@2026!'),
      name: 'Super Admin',
      role: 'super_admin',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
  });

  await prisma.admin.upsert({
    where: { id: 'admin-2' },
    update: {},
    create: {
      id: 'admin-2',
      email: 'ops@rideprestige.co.uk',
      passwordHash: hash('Ops@2026!'),
      name: 'Operations Manager',
      role: 'ops',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
  });

  // ─── Customers ─────────────────────────────────────────────────────────────

  await prisma.customer.upsert({
    where: { id: 'cust-1' },
    update: {},
    create: {
      id: 'cust-1',
      fullName: 'James Hartley',
      email: 'james@example.com',
      phone: '+44 7700 900100',
      passwordHash: hash('Customer@123'),
      isVerified: true,
      totalBookings: 3,
      createdAt: new Date('2026-01-15T10:00:00Z'),
    },
  });

  await prisma.customer.upsert({
    where: { id: 'cust-2' },
    update: {},
    create: {
      id: 'cust-2',
      fullName: 'Sarah Patel',
      email: 'sarah@example.com',
      phone: '+44 7700 900200',
      passwordHash: hash('Customer@123'),
      isVerified: true,
      totalBookings: 1,
      createdAt: new Date('2026-02-20T10:00:00Z'),
    },
  });

  // ─── Affiliates ────────────────────────────────────────────────────────────

  // No approved demo affiliate is seeded. Affiliates must register and pass document review.

  await prisma.affiliate.upsert({
    where: { id: 'aff-2' },
    update: {},
    create: {
      id: 'aff-2',
      companyName: 'Yorkshire Premier Cars',
      tradingName: 'YPC Cabs',
      contactPerson: 'Lisa Morgan',
      email: 'lisa@ypc-cabs.co.uk',
      phone: '+44 114 555 0202',
      passwordHash: hash('Affiliate@123'),
      address: '5 Transport House, Leeds Road',
      city: 'Sheffield',
      postcode: 'S9 3BL',
      operatorLicenceNumber: 'OB7654321',
      companyRegNumber: '87654321',
      serviceAreas: ['Sheffield', 'Leeds', 'Wakefield'],
      bankAccountName: 'Yorkshire Premier Cars Ltd',
      sortCode: '30-00-00',
      accountNumber: '87654321',
      isApproved: false,
      rating: 0,
      totalJobs: 0,
      totalEarnings: 0,
      createdAt: new Date('2026-05-01T11:00:00Z'),
    },
  });

  // ─── Drivers ───────────────────────────────────────────────────────────────

  await prisma.driver.upsert({
    where: { id: 'drv-1' },
    update: { isApproved: true, applicationStatus: 'approved', status: 'available', documentsStatus: 'approved' },
    create: {
      id: 'drv-1',
      fullName: 'Mohammed Ali',
      email: 'driver@rideprestige.co.uk',
      phone: '+44 7700 100001',
      passwordHash: hash('Driver@123'),
      address: '23 Oak Street',
      city: 'Sheffield',
      postcode: 'S3 7TH',
      dateOfBirth: '1985-06-15',
      drivingLicenceNumber: 'ALI8506154MO9PQ',
      privateHireBadgeNumber: 'SY-PHV-1001',
      nationalInsurance: 'AB123456C',
      driverType: 'independentDriver',
      affiliateId: null,
      status: 'available',
      rating: 4.9,
      totalJobs: 87,
      totalEarnings: 12350,
      documentsStatus: 'approved',
      assignedVehicleId: 'fv-1',
      isApproved: true,
      applicationStatus: 'approved',
      joinedDate: new Date('2026-01-12T00:00:00Z'),
    },
  });

  // Service areas must be set so dispatchService's servesPickup() can match drv-2 against
  // demo bookings — otherwise this seeded independent driver never receives any ride offers.
  const drv2ServiceAreas = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];
  await prisma.driver.upsert({
    where: { id: 'drv-2' },
    update: { isApproved: true, applicationStatus: 'approved', status: 'available', documentsStatus: 'approved', serviceAreas: drv2ServiceAreas },
    create: {
      id: 'drv-2',
      fullName: 'Thomas Reeves',
      email: 'thomas.driver@example.com',
      phone: '+44 7700 100002',
      passwordHash: hash('Driver@123'),
      address: '78 Maple Avenue',
      city: 'Sheffield',
      postcode: 'S7 2LQ',
      dateOfBirth: '1990-11-22',
      drivingLicenceNumber: 'REEVE901228TJ9AB',
      privateHireBadgeNumber: 'SY-PHV-1002',
      driverType: 'independentDriver',
      status: 'available',
      rating: 4.7,
      totalJobs: 55,
      totalEarnings: 7920,
      documentsStatus: 'approved',
      serviceAreas: drv2ServiceAreas,
      isApproved: true,
      applicationStatus: 'approved',
      joinedDate: new Date('2026-05-10T00:00:00Z'),
    },
  });

  await prisma.driver.upsert({
    where: { id: 'drv-3' },
    update: {},
    create: {
      id: 'drv-3',
      fullName: 'James Okafor',
      email: 'james.okafor@example.com',
      phone: '+44 7700 100003',
      passwordHash: hash('Driver@123'),
      address: '41 Crookes Road',
      city: 'Sheffield',
      postcode: 'S10 1BA',
      dateOfBirth: '1992-03-08',
      drivingLicenceNumber: 'OKAFO920308JM9CD',
      privateHireBadgeNumber: 'SY-PHV-1003',
      driverType: 'independentDriver',
      affiliateId: null,
      status: 'offline',
      rating: 0,
      totalJobs: 0,
      totalEarnings: 0,
      documentsStatus: 'missing',
      isApproved: false,
      applicationStatus: 'pending',
      joinedDate: new Date('2026-06-10T00:00:00Z'),
    },
  });

  await prisma.driver.upsert({
    where: { id: 'drv-4' },
    update: {},
    create: {
      id: 'drv-4',
      fullName: 'Priya Nair',
      email: 'priya.nair@example.com',
      phone: '+44 7700 100004',
      passwordHash: hash('Driver@123'),
      address: '9 Ecclesall Road',
      city: 'Sheffield',
      postcode: 'S11 8PA',
      dateOfBirth: '1988-09-19',
      drivingLicenceNumber: 'NAIR880919PN9EF',
      privateHireBadgeNumber: 'SY-PHV-1004',
      driverType: 'independentDriver',
      status: 'offline',
      rating: 0,
      totalJobs: 0,
      totalEarnings: 0,
      documentsStatus: 'missing',
      serviceAreas: ['S11'],
      isApproved: false,
      applicationStatus: 'pending',
      joinedDate: new Date('2026-06-14T00:00:00Z'),
    },
  });

  await prisma.driver.upsert({
    where: { id: 'drv-5' },
    update: {},
    create: {
      id: 'drv-5',
      fullName: 'Robert Tanner',
      email: 'robert.tanner@ypc-cabs.co.uk',
      phone: '+44 7700 100005',
      passwordHash: hash('Driver@123'),
      address: '17 Leeds Road',
      city: 'Sheffield',
      postcode: 'S9 3BL',
      dateOfBirth: '1979-12-02',
      drivingLicenceNumber: 'TANNE791202RT9GH',
      privateHireBadgeNumber: 'SY-PHV-1005',
      driverType: 'affiliateDriver',
      affiliateId: 'aff-2',
      status: 'offline',
      rating: 4.2,
      totalJobs: 13,
      totalEarnings: 980,
      documentsStatus: 'rejected',
      isApproved: false,
      applicationStatus: 'suspended',
      joinedDate: new Date('2026-04-02T00:00:00Z'),
    },
  });

  // ─── Driver Documents ──────────────────────────────────────────────────────

  const drv1Docs = [
    { id: 'doc-1a', driverId: 'drv-1', type: 'driving_licence', label: 'Driving Licence', status: 'approved', expiryDate: '2030-06-14', uploadedAt: new Date('2026-01-12T10:00:00Z') },
    { id: 'doc-1b', driverId: 'drv-1', type: 'phv_badge',       label: 'PHV Badge',               status: 'approved', expiryDate: '2027-01-01', uploadedAt: new Date('2026-01-12T10:05:00Z') },
    { id: 'doc-1c', driverId: 'drv-1', type: 'dbs_check',       label: 'DBS Check',               status: 'approved', uploadedAt: new Date('2026-01-12T10:10:00Z') },
    { id: 'doc-1d', driverId: 'drv-1', type: 'insurance',       label: 'Insurance Certificate',   status: 'approved', expiryDate: '2027-03-31', uploadedAt: new Date('2026-01-12T10:15:00Z') },
  ];

  // drv-2 is seeded as an active, approved independent driver (status/isApproved/applicationStatus/
  // documentsStatus all 'approved'/available), so its documents must be approved too — otherwise
  // isDriverDocumentEligible() silently excludes it from every independent dispatch offer.
  const drv2Docs = [
    { id: 'doc-2a', driverId: 'drv-2', type: 'driving_licence', label: 'Driving Licence',       status: 'approved', expiryDate: '2030-11-21', uploadedAt: new Date('2026-05-10T09:00:00Z') },
    { id: 'doc-2b', driverId: 'drv-2', type: 'phv_badge',       label: 'PHV Badge',             status: 'approved', expiryDate: '2027-05-10', uploadedAt: new Date('2026-05-10T09:05:00Z') },
    { id: 'doc-2c', driverId: 'drv-2', type: 'dbs_check',       label: 'DBS Check',             status: 'approved', uploadedAt: new Date('2026-05-10T09:08:00Z') },
    { id: 'doc-2d', driverId: 'drv-2', type: 'insurance',       label: 'Insurance Certificate', status: 'approved', expiryDate: '2027-05-09', uploadedAt: new Date('2026-05-10T09:10:00Z') },
  ];

  const pendingDriverDocs = (driverId: string) => [
    { id: `doc-${driverId}-a`, driverId, type: 'driving_licence', label: 'Driving Licence',       status: 'missing' },
    { id: `doc-${driverId}-b`, driverId, type: 'phv_badge',       label: 'PHV Badge',             status: 'missing' },
    { id: `doc-${driverId}-c`, driverId, type: 'dbs_check',       label: 'DBS Check',             status: 'missing' },
    { id: `doc-${driverId}-d`, driverId, type: 'insurance',       label: 'Insurance Certificate', status: 'missing' },
  ];

  for (const doc of [...drv1Docs, ...drv2Docs, ...pendingDriverDocs('drv-3'), ...pendingDriverDocs('drv-4'), ...pendingDriverDocs('drv-5')]) {
    await prisma.driverDocument.upsert({
      where: { id: doc.id },
      update: doc,
      create: doc,
    });
  }

  // ─── Fleet Vehicles ────────────────────────────────────────────────────────

  const fleetVehicles = [
    {
      id: 'fv-1', make: 'Mercedes-Benz', model: 'E-Class', year: 2023, registration: 'SH23 EXC',
      vehicleType: 'Executive', vehicleCategory: 'prestige',
      colour: 'Obsidian Black', passengerCapacity: 3, luggageCapacity: 3,
      motExpiry: '2026-12-01', insuranceExpiry: '2027-03-31', phvLicenceExpiry: '2027-01-01',
      status: 'available', ownerDriverId: 'drv-1', assignedDriverId: 'drv-1', isApproved: true, approvalStatus: 'approved',
    },
    {
      id: 'fv-2', make: 'Range Rover', model: 'Sport', year: 2022, registration: 'SH22 RRS',
      vehicleType: 'Luxury', vehicleCategory: 'prestige',
      colour: 'Santorini Black', passengerCapacity: 4, luggageCapacity: 4,
      motExpiry: '2026-11-15', insuranceExpiry: '2027-01-31', phvLicenceExpiry: '2027-01-01',
      status: 'available', isApproved: true, approvalStatus: 'approved',
    },
    {
      id: 'fv-3', make: 'Ford', model: 'Transit', year: 2021, registration: 'SH21 MIN',
      vehicleType: 'Minibus', vehicleCategory: 'minibus',
      colour: 'White', passengerCapacity: 16, luggageCapacity: 16,
      motExpiry: '2026-08-20', insuranceExpiry: '2027-02-28', phvLicenceExpiry: '2027-01-01',
      status: 'available', isApproved: true, approvalStatus: 'approved',
    },
    {
      id: 'fv-4', make: 'Toyota', model: 'Corolla', year: 2022, registration: 'SH22 TAX',
      vehicleType: 'Saloon', vehicleCategory: 'taxi',
      colour: 'White', passengerCapacity: 4, luggageCapacity: 2,
      motExpiry: '2026-10-01', insuranceExpiry: '2027-03-31', phvLicenceExpiry: '2027-01-01',
      status: 'available',
    },
    {
      // Thomas Reeves (drv-2) is the seeded independent driver — he needs his own approved
      // vehicle, otherwise dispatchService never finds an eligible vehicle for him and he
      // never receives any independent ride offers.
      id: 'fv-5', make: 'BMW', model: '5 Series', year: 2023, registration: 'SH23 IND',
      vehicleType: 'Executive', vehicleCategory: 'prestige',
      colour: 'Mineral Grey', passengerCapacity: 4, luggageCapacity: 3,
      motExpiry: '2027-05-01', insuranceExpiry: '2027-05-01', phvLicenceExpiry: '2027-05-01',
      status: 'available', ownerDriverId: 'drv-2', isApproved: true, approvalStatus: 'approved',
    },
  ];

  for (const v of fleetVehicles) {
    await prisma.fleetVehicle.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    });
  }

  // ─── Website Fleet Vehicles ────────────────────────────────────────────────

  const websiteVehicles = [
    {
      id: 'wv-p1', categorySlug: 'prestige', name: 'Range Rover', badge: 'Most Popular',
      description: 'The pinnacle of British luxury SUVs. Commanding presence, supreme comfort and advanced technology.',
      passengers: 4, luggage: '4 large cases',
      features: ['Heated leather seats', 'Panoramic sunroof', 'Climate control', 'Wi-Fi on board', 'Professional chauffeur', 'Meet & greet service'],
      imageUrl: 'https://images.unsplash.com/photo-1563458563737-e60b1f1b345f?fm=jpg&q=80&w=800', available: true, priceNote: '',
    },
    {
      id: 'wv-p2', categorySlug: 'prestige', name: 'Mercedes Vito Executive',
      description: 'Unparalleled space and luxury for up to 7 passengers. Perfect for corporate group travel.',
      passengers: 7, luggage: '7 large cases',
      features: ['Leather captain seats', 'Individual climate zones', 'Entertainment screens', 'USB & wireless charging', 'Privacy glass', 'Professional chauffeur'],
      imageUrl: 'https://images.pexels.com/photos/17455625/pexels-photo-17455625.jpeg?cs=srgb&fm=jpg&w=800', available: true, priceNote: '',
    },
    {
      id: 'wv-p3', categorySlug: 'prestige', name: 'BMW 5 Series',
      description: 'Athletic performance and executive comfort ideal for business travel.',
      passengers: 3, luggage: '3 large cases',
      features: ['Full leather interior', 'Ambient lighting', 'Apple CarPlay', 'Heated seats', 'Professional driver', 'Complimentary water'],
      imageUrl: 'https://images.unsplash.com/photo-1551836989-b4622a17a792?fm=jpg&q=80&w=800', available: true, priceNote: '',
    },
    {
      id: 'wv-p4', categorySlug: 'prestige', name: 'Rolls-Royce Phantom', badge: 'Iconic',
      description: 'The Rolls-Royce Phantom — the pinnacle of ultra-luxury motoring for the most important occasions.',
      passengers: 4, luggage: '3 cases',
      features: ['Starlight headliner', 'Bespoke Gallery dashboard', 'Spirit of Ecstasy', 'Whisper-quiet cabin', 'Dedicated concierge', 'Red carpet arrival'],
      imageUrl: 'https://images.unsplash.com/photo-1729513393829-7cf086494232?fm=jpg&q=80&w=800', available: true, priceNote: '',
    },
    {
      id: 'wv-m1', categorySlug: 'minibus', name: '16-Seater Minibus', badge: 'Standard',
      description: 'Our 16-seater minibus delivers spacious, air-conditioned comfort for airport transfers, corporate group travel, and private outings — with a professional, fully licensed driver at the wheel throughout your journey.',
      passengers: 16, luggage: 'Up to 10 large cases',
      features: ['Air conditioning', 'High-back reclining seats', 'Dedicated luggage trailer available', 'USB charging points', 'Professional, uniformed driver', 'Door-to-door service'],
      imageUrl: '/images/fleet/minibus-16.webp', available: true, priceNote: '',
    },
    {
      id: 'wv-m2', categorySlug: 'minibus', name: '24-Seater Minibus', badge: 'Best Value',
      description: 'Built for larger groups, our 24-seater minibus is the ideal choice for school trips, sports teams, and family transfers — combining generous seating with secure, comfortable group travel across Sheffield and beyond.',
      passengers: 24, luggage: 'Up to 16 large cases',
      features: ['Full air conditioning', 'High-back reclining seats', 'Large rear luggage bay', 'USB charging points', 'Professional, uniformed driver', 'DDA-compliant access'],
      imageUrl: '/images/fleet/minibus-24.webp', available: true, priceNote: '',
    },
    {
      id: 'wv-c1', categorySlug: 'coaches', name: '44-Seater Coach', badge: 'Best Value',
      description: 'Our 44-seater executive coach is designed for events, corporate excursions, and large group journeys — offering reclining seats, underfloor luggage storage, and on-board comfort for long-distance travel.',
      passengers: 44, luggage: 'Underfloor luggage bay (up to 44 cases)',
      features: ['Air conditioning', 'Reclining seats', 'Underfloor luggage storage', 'On-board entertainment system', 'Free Wi-Fi', 'PA system & microphone'],
      imageUrl: '/images/fleet/coach-44.webp', available: true, priceNote: '',
    },
    {
      id: 'wv-t1', categorySlug: 'taxi', name: 'Toyota Corolla',
      description: 'A reliable and efficient saloon taxi for everyday journeys across Sheffield.',
      passengers: 4, luggage: '2 medium cases',
      features: ['Air conditioning', 'GPS navigation', 'Card payments accepted', 'Fully licensed & insured'],
      imageUrl: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?fm=jpg&q=80&w=800', available: true, priceNote: '',
    },
  ];

  for (const v of websiteVehicles) {
    await prisma.websiteVehicle.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    });
  }

  // ─── Website Fleet Categories ──────────────────────────────────────────────

  const fleetCategories = [
    { id: 'cat-1', slug: 'prestige', name: 'Prestige Vehicles', tagline: 'Luxury travel for every occasion',   description: 'Executive cars and luxury vehicles for corporate travel, airport transfers, and VIP journeys.', icon: 'prestige', available: true, order: 1 },
    { id: 'cat-2', slug: 'minibus',  name: 'Minibuses',         tagline: 'Spacious group travel, done right',  description: 'A modern, well-maintained fleet of minibuses for airport transfers, corporate group travel, school trips, and private events — comfortable, air-conditioned, and driven by fully licensed professionals.', icon: 'minibus',  available: true, order: 2 },
    { id: 'cat-3', slug: 'coaches',  name: 'Coaches',           tagline: 'Premium coach travel for large groups', description: 'Full-size executive coaches for large groups, corporate events, school trips, and long-distance travel — combining generous capacity with on-board comfort and professional drivers.', icon: 'coach', available: true, order: 3 },
    { id: 'cat-4', slug: 'taxi',     name: 'Taxis',             tagline: 'Reliable local taxi service',        description: 'Standard taxi service for everyday journeys across Sheffield and South Yorkshire.', icon: 'taxi', available: true, order: 4 },
  ];

  for (const c of fleetCategories) {
    await prisma.websiteFleetCategory.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  // ─── Jobs ──────────────────────────────────────────────────────────────────
  // Seed creates NO fake jobs. All jobs/bookings come from real usage of the platform.
  // To delete the old mock jobs (job-1 to job-4) run: npm run db:cleanup-mocks

  if (false) { // kept for reference only — never executed
  const jobs = [
    {
      id: 'job-1',
      bookingRef: 'RP-2026-1001',
      customerId: 'cust-1',
      customerName: 'James Hartley',
      customerPhone: '+44 7700 900100',
      customerEmail: 'james@example.com',
      pickupAddress: 'Sheffield Midland Station, S1 1AB',
      dropoffAddress: 'Manchester Airport, M90 1QX',
      stops: [],
      dateTime: new Date('2026-06-15T09:00:00Z'),
      passengerCount: 2,
      luggageCount: 2,
      vehicleTypeRequested: 'Executive',
      vehicleCategory: 'prestige',
      fareAmount: 220,
      commissionAmount: 60.5,
      affiliatePayoutAmount: 132,
      driverPayoutAmount: 132,
      distance: '38 miles',
      estimatedDuration: '55 min',
      flightNumber: 'EZY1234',
      status: 'driver_accepted',
      affiliateId: null,
      assignedDriverId: 'drv-1',
      assignedVehicleId: 'fv-1',
      createdAt: new Date('2026-06-10T08:00:00Z'),
      updatedAt: new Date('2026-06-10T09:30:00Z'),
    },
    {
      id: 'job-2',
      bookingRef: 'RP-2026-1002',
      customerId: 'cust-2',
      customerName: 'Sarah Patel',
      customerPhone: '+44 7700 900200',
      customerEmail: 'sarah@example.com',
      pickupAddress: '10 Devonshire Street, Sheffield, S3 7SF',
      dropoffAddress: 'Leeds Bradford Airport, LS19 7TU',
      stops: [],
      dateTime: new Date('2026-06-16T14:00:00Z'),
      passengerCount: 16,
      luggageCount: 12,
      vehicleTypeRequested: 'Minibus',
      vehicleCategory: 'minibus',
      fareAmount: 480,
      commissionAmount: 132,
      affiliatePayoutAmount: 288,
      driverPayoutAmount: 288,
      distance: '42 miles',
      estimatedDuration: '65 min',
      specialInstructions: 'Corporate away day — please display company name sign',
      status: 'awaiting_affiliate',
      createdAt: new Date('2026-06-09T10:00:00Z'),
      updatedAt: new Date('2026-06-09T10:00:00Z'),
    },
    {
      id: 'job-3',
      bookingRef: 'RP-2026-1003',
      customerName: 'Thomas Williams',
      customerPhone: '+44 7700 900300',
      customerEmail: 'thomas@example.com',
      pickupAddress: 'Meadowhall Shopping Centre, Sheffield, S9 1EP',
      dropoffAddress: 'Silverstone Circuit, NN12 8TN',
      stops: [],
      dateTime: new Date('2026-06-20T07:30:00Z'),
      passengerCount: 44,
      luggageCount: 20,
      vehicleTypeRequested: 'Coach',
      vehicleCategory: 'coaches',
      fareAmount: 980,
      commissionAmount: 269.5,
      affiliatePayoutAmount: 588,
      driverPayoutAmount: 588,
      distance: '95 miles',
      estimatedDuration: '2h 10min',
      specialInstructions: 'School trip — students aged 14-16',
      status: 'awaiting_affiliate',
      createdAt: new Date('2026-06-08T11:00:00Z'),
      updatedAt: new Date('2026-06-08T11:00:00Z'),
    },
    {
      id: 'job-4',
      bookingRef: 'RP-2026-0950',
      customerName: 'Emily Stone',
      customerPhone: '+44 7700 900400',
      pickupAddress: 'Kenwood Hotel, Sheffield, S7 1NQ',
      dropoffAddress: 'Heathrow Airport T5, TW6 2GA',
      stops: [],
      dateTime: new Date('2026-06-01T05:00:00Z'),
      passengerCount: 1,
      luggageCount: 2,
      vehicleTypeRequested: 'Luxury',
      vehicleCategory: 'prestige',
      fareAmount: 420,
      commissionAmount: 115.5,
      affiliatePayoutAmount: 252,
      driverPayoutAmount: 252,
      distance: '170 miles',
      estimatedDuration: '2h 45min',
      flightNumber: 'BA0117',
      status: 'completed',
      affiliateId: null,
      assignedDriverId: 'drv-1',
      assignedVehicleId: 'fv-2',
      createdAt: new Date('2026-05-28T10:00:00Z'),
      updatedAt: new Date('2026-06-01T08:00:00Z'),
    },
  ];

  for (const j of jobs) {
    await prisma.job.upsert({
      where: { id: j.id },
      update: {},
      create: j,
    });
  }
  } // end if(false)

  // ─── Bookings ──────────────────────────────────────────────────────────────
  // Also disabled — bookings are created by real usage

  if (false) { // kept for reference only — never executed
  const bookings = [
    {
      id: 'bk-001',
      reference: 'RP-2026-1001',
      status: 'accepted',
      createdAt: new Date('2026-06-10T08:00:00Z'),
      updatedAt: new Date('2026-06-10T08:30:00Z'),
      customerId: 'cust-1',
      customerData: { fullName: 'James Hartley', phone: '+44 7700 900100', email: 'james@example.com' },
      journeyData: { pickupPostcode: 'S1 1AB', dropoffPostcode: 'M90 1QX', bookingType: 'scheduled', date: '2026-06-15', time: '09:00', passengers: 2 },
      vehicleCategory: 'prestige',
      estimatedMiles: 38,
      estimatedFare: 220,
      jobId: 'job-1',
    },
    {
      id: 'bk-002',
      reference: 'RP-2026-1002',
      status: 'pending',
      createdAt: new Date('2026-06-09T10:00:00Z'),
      updatedAt: new Date('2026-06-09T10:00:00Z'),
      customerId: 'cust-2',
      customerData: { fullName: 'Sarah Patel', phone: '+44 7700 900200', email: 'sarah@example.com' },
      journeyData: { pickupPostcode: 'S3 7SF', dropoffPostcode: 'LS19 7TU', bookingType: 'scheduled', date: '2026-06-16', time: '14:00', passengers: 16, notes: 'Corporate away day' },
      vehicleCategory: 'minibus',
      estimatedMiles: 42,
      estimatedFare: 480,
      jobId: 'job-2',
    },
    {
      id: 'bk-003',
      reference: 'RP-2026-1003',
      status: 'pending',
      createdAt: new Date('2026-06-08T11:00:00Z'),
      updatedAt: new Date('2026-06-08T11:00:00Z'),
      customerData: { fullName: 'Thomas Williams', phone: '+44 7700 900300', email: 'thomas@example.com' },
      journeyData: { pickupPostcode: 'S9 1EP', dropoffPostcode: 'NN12 8TN', bookingType: 'scheduled', date: '2026-06-20', time: '07:30', passengers: 44, notes: 'School trip' },
      vehicleCategory: 'coaches',
      estimatedMiles: 95,
      estimatedFare: 980,
      jobId: 'job-3',
    },
  ];

  for (const b of bookings) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }
  } // end if(false)

  // ─── Earnings ──────────────────────────────────────────────────────────────
  // Earnings are created automatically when rides complete — no seed data needed

  // ─── Notifications ─────────────────────────────────────────────────────────

  await prisma.notification.deleteMany({ where: { id: 'notif-1' } });

  await prisma.notification.upsert({
    where: { id: 'notif-2' },
    update: {},
    create: {
      id: 'notif-2',
      recipientId: 'drv-1',
      recipientRole: 'driver',
      title: 'Job Assigned',
      body: 'You have been assigned to job RP-2026-1001. Pickup at Sheffield Midland Station on 15 Jun.',
      type: 'job',
      isRead: false,
      createdAt: new Date('2026-06-10T09:30:00Z'),
    },
  });

  // ─── Support Tickets ───────────────────────────────────────────────────────

  await prisma.supportTicket.upsert({
    where: { id: 'tk-001' },
    update: {},
    create: {
      id: 'tk-001',
      reference: 'TK-001',
      type: 'enquiry',
      status: 'open',
      createdAt: new Date('2026-06-01T09:00:00Z'),
      updatedAt: new Date('2026-06-01T09:00:00Z'),
      customerData: { name: 'Alice Brown', email: 'alice@example.com', phone: '+44 7700 900500' },
      subject: 'Booking enquiry for Rolls-Royce for wedding',
      message: 'I would like to hire the Rolls-Royce Phantom for my wedding on 15 July. Can you provide a quote?',
    },
  });

  await prisma.supportTicket.upsert({
    where: { id: 'tk-002' },
    update: {},
    create: {
      id: 'tk-002',
      reference: 'TK-002',
      type: 'booking_support',
      status: 'in_progress',
      createdAt: new Date('2026-06-08T15:00:00Z'),
      updatedAt: new Date('2026-06-09T09:00:00Z'),
      customerData: { name: 'Michael Chen', email: 'michael@example.com' },
      bookingReference: 'RP-2026-1001',
      subject: 'Amend pickup time for RP-2026-1001',
      message: 'I need to change the pickup time from 09:00 to 10:30.',
      adminNotes: 'Contacted driver — time change is possible.',
    },
  });

  // ─── Pricing Config ────────────────────────────────────────────────────────

  await prisma.pricingConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      prestigeRatePerMile: 4.40,
      prestigeHourlyRate: 70,
      minibusRatePerMile: 4.00,
      minibusRate16Seater: 420,
      minibusRate24Seater: 520,
      minibusRate32Seater: 620,
      coachesRatePerMile: 4.00,
      coachesHourlyRate: 110,
      taxiRatePerMile: 3.00,
      taxiMinimumFare: 8,
      driverSearchRadiusMiles: 20,
      commissionPercentage: 15,
      driverPayoutPercentage: 100,
    },
  });

  // ─── Site Settings ─────────────────────────────────────────────────────────

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: 'Ride Prestige',
      tagline: 'RIDE PRESTIGE',
      heroSubtitle: 'Coach and minibus hire across Sheffield and the UK',
      logoUrl: '/brand/ride-prestige-mark.png',
      faviconUrl: '/favicon.ico',
      brandColor: '#000000',
      accentColor: '#c9a84c',
      contactEmail: 'bookings@rideprestige.co.uk',
      phoneNumber: '+44 114 000 0000',
      address: 'Sheffield, South Yorkshire, S1 1AB',
      socialLinks: { twitter: 'https://twitter.com/rideprestige', instagram: 'https://instagram.com/rideprestige', linkedin: 'https://linkedin.com/company/rideprestige' },
      seoDefaults: { title: 'Ride Prestige — Coach & Minibus Hire UK', description: 'Coach and minibus hire across Sheffield and the UK.', ogImage: '/og-image.jpg' },
      emailNotifications: true,
      smsNotifications: false,
    },
  });

  // ─── Navigation ────────────────────────────────────────────────────────────

  const navItems = [
    { id: 'nav-1', label: 'Home',       href: '/',           visible: true, order: 1 },
    { id: 'nav-2', label: 'Book',       href: '/book',       visible: true, order: 2 },
    { id: 'nav-3', label: 'Fleet',      href: '/fleet',      visible: true, order: 3 },
    { id: 'nav-4', label: 'Promotions', href: '/promotions', visible: true, order: 4 },
    { id: 'nav-5', label: 'FAQ',        href: '/faq',        visible: true, order: 5 },
    { id: 'nav-6', label: 'Contact',    href: '/contact',    visible: true, order: 6 },
  ];

  for (const n of navItems) {
    await prisma.navigationItem.upsert({ where: { id: n.id }, update: {}, create: n });
  }

  // ─── Promotions ────────────────────────────────────────────────────────────

  const promotions = [
    { id: 'promo-1', title: 'Airport Transfer Special', description: 'Book any airport transfer and receive 15% off your fare.', couponCode: 'AIRPORT15', discountType: 'percentage', discountValue: 15, startDate: '2026-01-01', endDate: '2026-12-31', active: true, terms: 'Valid on all airport transfers. Cannot be combined with other offers.' },
    { id: 'promo-2', title: 'Corporate Account Discount', description: 'Set up a corporate account and enjoy 20% off all bookings.', couponCode: 'CORP20', discountType: 'percentage', discountValue: 20, startDate: '2026-01-01', endDate: '2026-12-31', active: true, terms: 'Valid for verified corporate accounts only.' },
    { id: 'promo-3', title: 'New Customer Welcome Offer', description: 'New to Ride Prestige? Enjoy £10 off your first booking.', couponCode: 'WELCOME10', discountType: 'fixed', discountValue: 10, startDate: '2026-01-01', endDate: '2026-12-31', active: true, terms: 'First-time customers only. Minimum booking value £50.' },
  ];

  for (const p of promotions) {
    await prisma.promotion.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  // ─── FAQ Items ─────────────────────────────────────────────────────────────

  const faqItems = [
    { id: 'faq-1', question: 'How do I book a vehicle?', answer: 'Enter your pickup and drop-off postcodes, select your vehicle type, choose date and time, then click "Get Quote". Review your fare estimate and confirm your booking.', category: 'Booking', order: 1, active: true },
    { id: 'faq-2', question: 'What areas do you cover?', answer: 'We cover Sheffield and all of South Yorkshire as our primary area, with nationwide UK transport for longer journeys.', category: 'Service', order: 1, active: true },
    { id: 'faq-3', question: 'What is your cancellation policy?', answer: 'Cancellations must be made at least 8 hours before your scheduled ride. Refunds are processed within 48 hours of approval.', category: 'Cancellation', order: 1, active: true },
    { id: 'faq-4', question: 'Are your drivers licensed?', answer: 'Yes, all drivers are fully licensed, insured, and DBS-checked. Prestige vehicle chauffeurs hold professional chauffeur licences.', category: 'Service', order: 2, active: true },
    { id: 'faq-5', question: 'Do you offer meet and greet at airports?', answer: 'Yes, our prestige and executive vehicles include a professional meet and greet service at all major UK airports.', category: 'Service', order: 3, active: true },
    { id: 'faq-6', question: 'How far in advance should I book?', answer: 'For same-day bookings, we recommend at least 2 hours notice. For scheduled bookings, 24-48 hours in advance is ideal.', category: 'Booking', order: 2, active: true },
  ];

  for (const f of faqItems) {
    await prisma.fAQItem.upsert({ where: { id: f.id }, update: {}, create: f });
  }

  // ─── Cancellation Policy ───────────────────────────────────────────────────

  await prisma.cancellationPolicy.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      minHoursBeforeRide: 8,
      refundWindowHours: 48,
      message: 'Cancellations must be made at least 8 hours before your scheduled ride. Cancellations within 8 hours of pickup are non-refundable. Refunds are processed within 48 hours of approval.',
    },
  });

  // ─── Website Pages ─────────────────────────────────────────────────────────

  await prisma.websitePage.upsert({
    where: { id: 'page-home' },
    update: {},
    create: {
      id: 'page-home',
      slug: 'home',
      title: 'Homepage',
      seoTitle: 'Ride Prestige — Coach & Minibus Hire UK',
      metaDescription: 'Coach and minibus hire across Sheffield and the UK. Reliable transport for groups, events and airport transfers.',
      ogTitle: 'Ride Prestige',
      ogDescription: 'Your local transport minutes away.',
      sectionsJson: [],
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
