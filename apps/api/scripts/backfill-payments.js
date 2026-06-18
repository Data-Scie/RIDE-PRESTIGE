/**
 * One-off backfill: creates a Payment record for every already-completed Job that
 * predates the Payment model (introduced after this point, ride completion now
 * creates these automatically). Safe to re-run — skips jobs that already have one.
 *
 * Run: node scripts/backfill-payments.js
 */

const { PrismaClient } = require('@prisma/client');
const { v4: uuid } = require('uuid');
const prisma = new PrismaClient();

async function main() {
  const completedJobs = await prisma.job.findMany({ where: { status: 'completed' } });
  const existing = await prisma.payment.findMany({ where: { jobId: { in: completedJobs.map(j => j.id) } } });
  const existingJobIds = new Set(existing.map(p => p.jobId));
  const toCreate = completedJobs.filter(j => !existingJobIds.has(j.id));

  for (const job of toCreate) {
    await prisma.payment.create({
      data: {
        id: `pay-${uuid()}`,
        jobId: job.id,
        bookingRef: job.bookingRef,
        customerId: job.customerId,
        customerName: job.customerName,
        amount: job.fareAmount,
        method: 'cash',
        status: 'paid',
        paidAt: job.completedAt ?? job.updatedAt,
      },
    });
  }
  console.log(`Backfilled ${toCreate.length} payment record(s) (${existingJobIds.size} already existed).`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
