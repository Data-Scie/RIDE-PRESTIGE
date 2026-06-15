/**
 * Safe cleanup: removes ONLY fake transactional data from the seed script.
 * All accounts (admin, ops, affiliate, driver, customer) and fleet vehicles
 * are kept intact so you can still log in and use the system.
 *
 * Run: node scripts/cleanup-mock-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MOCK_JOB_IDS     = ['job-1', 'job-2', 'job-3', 'job-4'];
const MOCK_BOOKING_IDS = ['bk-001', 'bk-002', 'bk-003', 'bk-004'];
const MOCK_EARNING_IDS = ['earn-1', 'earn-2'];
const MOCK_NOTIF_IDS   = ['notif-1', 'notif-2'];
const MOCK_TICKET_IDS  = ['tk-001', 'tk-002'];

async function main() {
  console.log('Removing mock/seed transactional data from Supabase...\n');
  console.log('NOTE: All accounts, vehicles, and website content are kept.\n');

  // Must delete in dependency order
  const statusHistory = await prisma.rideStatusHistory.deleteMany({ where: { jobId: { in: MOCK_JOB_IDS } } });
  const locationHistory = await prisma.driverLocationHistory.deleteMany({ where: { jobId: { in: MOCK_JOB_IDS } } });
  const earnings = await prisma.earningEntry.deleteMany({ where: { id: { in: MOCK_EARNING_IDS } } });
  const notifications = await prisma.notification.deleteMany({ where: { id: { in: MOCK_NOTIF_IDS } } });
  const tickets = await prisma.supportTicket.deleteMany({ where: { id: { in: MOCK_TICKET_IDS } } });
  const bookings = await prisma.booking.deleteMany({ where: { id: { in: MOCK_BOOKING_IDS } } });
  const jobs = await prisma.job.deleteMany({ where: { id: { in: MOCK_JOB_IDS } } });

  console.log(`✓ ${jobs.count} fake jobs deleted`);
  console.log(`✓ ${bookings.count} fake bookings deleted`);
  console.log(`✓ ${earnings.count} fake earnings deleted`);
  console.log(`✓ ${notifications.count} mock notifications deleted`);
  console.log(`✓ ${tickets.count} mock support tickets deleted`);
  console.log(`✓ ${statusHistory.count} status history entries deleted`);
  console.log(`✓ ${locationHistory.count} location history entries deleted`);
  console.log('\nDone! All accounts, vehicles, and website content are untouched.');
  console.log('The system is now clean — only real bookings will appear going forward.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
