const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SEEDED = {
  bookings: ['bk-001', 'bk-002', 'bk-003'],
  jobs: ['job-1', 'job-2', 'job-3', 'job-4'],
  customers: ['cust-1', 'cust-2'],
  affiliates: ['aff-1', 'aff-2'],
  drivers: ['drv-1', 'drv-2'],
  vehicles: ['fv-1', 'fv-2', 'fv-3', 'fv-4'],
  driverDocuments: ['doc-1a', 'doc-1b', 'doc-1c', 'doc-1d', 'doc-2a', 'doc-2b', 'doc-2c', 'doc-2d'],
  earnings: ['earn-1', 'earn-2'],
  supportTickets: ['tk-001', 'tk-002'],
  promotions: ['promo-1', 'promo-2', 'promo-3'],
};

async function main() {
  const seededJobs = await prisma.job.findMany({
    where: { id: { in: SEEDED.jobs } },
    select: { assignedDriverId: true },
  });
  const userDriverIdsOnSeededJobs = seededJobs
    .map(job => job.assignedDriverId)
    .filter(id => id && !SEEDED.drivers.includes(id));
  const demoAffiliates = await prisma.affiliate.findMany({
    where: {
      OR: [
        { companyName: { startsWith: 'Codex Live Demo Transport' } },
        { email: { startsWith: 'affiliate.live.' } },
      ],
    },
    select: { id: true },
  });
  const demoAffiliateIds = demoAffiliates.map(affiliate => affiliate.id);
  const demoDrivers = demoAffiliateIds.length
    ? await prisma.driver.findMany({
        where: { affiliateId: { in: demoAffiliateIds } },
        select: { id: true },
      })
    : [];
  const demoDriverIds = demoDrivers.map(driver => driver.id);

  const jobIds = SEEDED.jobs;
  const driverIds = [...SEEDED.drivers, ...demoDriverIds];
  const affiliateIds = [...SEEDED.affiliates, ...demoAffiliateIds];

  const deleted = await prisma.$transaction(async tx => ({
    locationHistory: (await tx.driverLocationHistory.deleteMany({
      where: { OR: [{ jobId: { in: jobIds } }, { driverId: { in: driverIds } }] },
    })).count,
    statusHistory: (await tx.rideStatusHistory.deleteMany({ where: { jobId: { in: jobIds } } })).count,
    earnings: (await tx.earningEntry.deleteMany({
      where: { OR: [{ id: { in: SEEDED.earnings } }, { jobId: { in: jobIds } }] },
    })).count,
    notifications: (await tx.notification.deleteMany({
      where: { recipientId: { in: [...driverIds, ...affiliateIds, ...SEEDED.customers] } },
    })).count,
    bookings: (await tx.booking.deleteMany({ where: { id: { in: SEEDED.bookings } } })).count,
    jobs: (await tx.job.deleteMany({ where: { id: { in: jobIds } } })).count,
    driverDocuments: (await tx.driverDocument.deleteMany({
      where: { OR: [{ id: { in: SEEDED.driverDocuments } }, { driverId: { in: driverIds } }] },
    })).count,
    vehicles: (await tx.fleetVehicle.deleteMany({
      where: {
        OR: [
          { id: { in: SEEDED.vehicles } },
          { affiliateId: { in: demoAffiliateIds } },
          { assignedDriverId: { in: demoDriverIds } },
        ],
      },
    })).count,
    drivers: (await tx.driver.deleteMany({ where: { id: { in: driverIds } } })).count,
    affiliates: (await tx.affiliate.deleteMany({ where: { id: { in: affiliateIds } } })).count,
    customers: (await tx.customer.deleteMany({ where: { id: { in: SEEDED.customers } } })).count,
    supportTickets: (await tx.supportTicket.deleteMany({ where: { id: { in: SEEDED.supportTickets } } })).count,
    promotions: (await tx.promotion.deleteMany({ where: { id: { in: SEEDED.promotions } } })).count,
    resetUserDrivers: (await tx.driver.updateMany({
      where: { id: { in: userDriverIdsOnSeededJobs }, status: 'busy' },
      data: { status: 'available' },
    })).count,
  }));

  console.log(JSON.stringify({ success: true, deleted }, null, 2));
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
