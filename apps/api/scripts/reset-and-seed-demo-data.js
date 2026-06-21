// Wipes every operational/transactional record (bookings, jobs, drivers, vehicles,
// affiliates, customers, payments, earnings, notifications, history, support tickets)
// and replaces it with one clean affiliate + one clean independent driver, each fully
// approved with documents on file and a vehicle in every category.
//
// Preserved untouched: the Admin table (admin@rideprestige.co.uk / ops@rideprestige.co.uk
// logins) and every CMS/website-content table (pages, fleet showcase, pricing, FAQs,
// navigation, promotions, site settings, vacancies, courses, attributes).
//
// Run with: npm run db:reset-demo --workspace=apps/api

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const prisma = new PrismaClient();
const hash = (pw) => bcrypt.hashSync(pw, 10);

const FUTURE_DATE = '2028-12-31';
const DRIVER_DOCS = [
  { type: 'driving_licence', label: 'Driving Licence' },
  { type: 'phv_badge', label: 'PHV Badge' },
  { type: 'dbs_check', label: 'DBS Check' },
  { type: 'insurance', label: 'Insurance Certificate' },
];
const VEHICLE_DOCS = [
  { type: 'mot', label: 'MOT Certificate' },
  { type: 'insurance', label: 'Insurance Certificate' },
  { type: 'phv_licence', label: 'PHV / Private Hire Vehicle Licence' },
];

const CATEGORY_SPECS = [
  { category: 'prestige', make: 'Mercedes-Benz', model: 'E-Class', vehicleType: 'Executive', colour: 'Obsidian Black', passengerCapacity: 4, luggageCapacity: 3 },
  { category: 'minibus', make: 'Ford', model: 'Transit', vehicleType: 'Minibus', colour: 'White', passengerCapacity: 16, luggageCapacity: 16 },
  { category: 'coaches', make: 'Mercedes-Benz', model: 'Tourismo', vehicleType: 'Coach', colour: 'White', passengerCapacity: 49, luggageCapacity: 49 },
  { category: 'taxi', make: 'Toyota', model: 'Corolla', vehicleType: 'Saloon', colour: 'White', passengerCapacity: 4, luggageCapacity: 2 },
];

async function approvedDriverDocs(driverId) {
  await prisma.driverDocument.createMany({
    data: DRIVER_DOCS.map(doc => ({
      id: `doc-${uuid()}`,
      driverId,
      type: doc.type,
      label: doc.label,
      status: 'approved',
      fileUrl: `https://documents.example.com/${driverId}/${doc.type}.pdf`,
      expiryDate: FUTURE_DATE,
    })),
  });
}

async function approvedVehicleDocs(vehicleId) {
  await prisma.vehicleDocument.createMany({
    data: VEHICLE_DOCS.map(doc => ({
      id: `vdoc-${uuid()}`,
      vehicleId,
      type: doc.type,
      label: doc.label,
      status: 'approved',
      fileUrl: `https://documents.example.com/${vehicleId}/${doc.type}.pdf`,
      expiryDate: FUTURE_DATE,
    })),
  });
}

async function createVehicle(spec, ownership, suffix) {
  const id = `fv-${uuid()}`;
  await prisma.fleetVehicle.create({
    data: {
      id,
      make: spec.make,
      model: spec.model,
      year: 2025,
      registration: `RP${suffix}`,
      vehicleType: spec.vehicleType,
      vehicleCategory: spec.category,
      colour: spec.colour,
      passengerCapacity: spec.passengerCapacity,
      luggageCapacity: spec.luggageCapacity,
      motExpiry: FUTURE_DATE,
      insuranceExpiry: FUTURE_DATE,
      phvLicenceExpiry: FUTURE_DATE,
      status: 'available',
      isApproved: true,
      approvalStatus: 'approved',
      ...ownership,
    },
  });
  await approvedVehicleDocs(id);
  return id;
}

async function wipeOperationalData() {
  console.log('Wiping all operational/test data...');
  // Children first, respecting the schema's real foreign keys (Driver/FleetVehicle ->
  // Affiliate is Restrict, not Cascade, so affiliates must be cleared of drivers/vehicles
  // before the affiliate rows themselves can go).
  await prisma.rideOffer.deleteMany();
  await prisma.rideStatusHistory.deleteMany();
  await prisma.rideFlowEvent.deleteMany();
  await prisma.driverLocationHistory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.earningEntry.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.driverDocument.deleteMany();
  await prisma.affiliateDocument.deleteMany();
  await prisma.job.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.fleetVehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.affiliate.deleteMany();
  await prisma.customer.deleteMany();
  console.log('Done - all bookings/jobs/drivers/vehicles/affiliates/customers/payments/history cleared.');
  console.log('Preserved: Admin table (admin/ops logins) and all CMS/website-content tables.');
}

async function seedAffiliateWithFleet() {
  const password = 'Affiliate@123';
  const affiliateId = `aff-${uuid()}`;
  await prisma.affiliate.create({
    data: {
      id: affiliateId,
      companyName: 'Yorkshire Premier Cars',
      tradingName: 'Yorkshire Premier Cars',
      contactPerson: 'Lisa Whitfield',
      email: 'lisa@ypc-cabs.co.uk',
      phone: '+44 7700 900400',
      passwordHash: hash(password),
      address: '12 Tudor Square',
      city: 'Sheffield',
      postcode: 'S1 2LA',
      operatorLicenceNumber: 'SCC-OL-204781',
      companyRegNumber: '09876543',
      serviceAreas: ['S1', 'S2', 'S3', 'S10', 'S11'],
      bankAccountName: 'Yorkshire Premier Cars Ltd',
      sortCode: '20-00-00',
      accountNumber: '12345678',
      isApproved: true,
    },
  });
  await prisma.affiliateDocument.createMany({
    data: [
      { type: 'operator_licence', label: 'Operator Licence' },
      { type: 'insurance', label: 'Insurance Document' },
      { type: 'company_cert', label: 'Company Certificate' },
      { type: 'proof_of_address', label: 'Proof of Address' },
    ].map(doc => ({
      id: `adoc-${uuid()}`,
      affiliateId,
      type: doc.type,
      label: doc.label,
      status: 'approved',
      fileUrl: `https://documents.example.com/${affiliateId}/${doc.type}.pdf`,
      expiryDate: FUTURE_DATE,
    })),
  });

  const driverNames = ['Robert Tanner', 'Michael Bryce'];
  const driverEmails = ['robert.tanner@ypc-cabs.co.uk', 'michael.bryce@ypc-cabs.co.uk'];
  for (let i = 0; i < 2; i += 1) {
    const driverId = `drv-${uuid()}`;
    await prisma.driver.create({
      data: {
        id: driverId,
        fullName: driverNames[i],
        email: driverEmails[i],
        phone: `+44 7700 90041${i}`,
        passwordHash: hash(password),
        address: `${10 + i} Tudor Square`,
        city: 'Sheffield',
        postcode: 'S1 2LA',
        dateOfBirth: '1988-04-12',
        drivingLicenceNumber: `YPC-DL-${1000 + i}`,
        privateHireBadgeNumber: `YPC-PHV-${1000 + i}`,
        driverType: 'affiliateDriver',
        affiliateId,
        status: 'available',
        documentsStatus: 'approved',
        isApproved: true,
        applicationStatus: 'approved',
        serviceAreas: ['S1', 'S2', 'S3', 'S10', 'S11'],
      },
    });
    await approvedDriverDocs(driverId);
  }

  for (let i = 0; i < CATEGORY_SPECS.length; i += 1) {
    await createVehicle(CATEGORY_SPECS[i], { affiliateId }, `YPC${i + 1}`);
  }

  console.log(`Seeded affiliate "Yorkshire Premier Cars" (${'lisa@ypc-cabs.co.uk'} / ${password}) with 2 drivers and 4 vehicles (one per category).`);
}

async function seedIndependentDriver() {
  const password = 'Driver@123';
  const driverId = `drv-${uuid()}`;
  await prisma.driver.create({
    data: {
      id: driverId,
      fullName: 'James Okafor',
      email: 'james.okafor@example.com',
      phone: '+44 7700 900420',
      passwordHash: hash(password),
      address: '4 Ecclesall Road',
      city: 'Sheffield',
      postcode: 'S11 8NX',
      dateOfBirth: '1985-09-23',
      drivingLicenceNumber: 'IND-DL-2001',
      privateHireBadgeNumber: 'IND-PHV-2001',
      driverType: 'independentDriver',
      status: 'available',
      documentsStatus: 'approved',
      isApproved: true,
      applicationStatus: 'approved',
      serviceAreas: ['S1', 'S2', 'S3', 'S10', 'S11'],
    },
  });
  await approvedDriverDocs(driverId);

  for (let i = 0; i < CATEGORY_SPECS.length; i += 1) {
    await createVehicle(CATEGORY_SPECS[i], { ownerDriverId: driverId }, `IND${i + 1}`);
  }

  console.log(`Seeded independent driver "James Okafor" (james.okafor@example.com / ${password}) with 4 vehicles (one per category).`);
}

async function main() {
  await wipeOperationalData();
  await seedAffiliateWithFleet();
  await seedIndependentDriver();
  console.log('Reset and reseed complete.');
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
