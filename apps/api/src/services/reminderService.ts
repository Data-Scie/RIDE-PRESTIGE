import cron from 'node-cron';
import { prisma } from '../lib/db';
import { pushNotification } from './notificationService';

const WINDOWS = [
  { minutes: 24 * 60, label: '24 hours' },
  { minutes: 60,      label: '1 hour'   },
  { minutes: 15,      label: '15 minutes' },
];

async function sendRideReminders() {
  const now = new Date();

  for (const window of WINDOWS) {
    const windowStart = new Date(now.getTime() + window.minutes * 60_000 - 60_000);
    const windowEnd   = new Date(now.getTime() + window.minutes * 60_000 + 60_000);

    const upcoming = await prisma.job.findMany({
      where: {
        dateTime: { gte: windowStart, lte: windowEnd },
        status: { notIn: ['completed', 'cancelled'] },
      },
    });

    for (const job of upcoming) {
      if (job.assignedDriverId) {
        await pushNotification(
          job.assignedDriverId,
          'driver',
          `Ride in ${window.label}`,
          `Your job ${job.bookingRef} is scheduled in ${window.label}. Pickup: ${job.pickupAddress}`,
          'job',
        );
      }

      if (job.customerId) {
        await pushNotification(
          job.customerId,
          'customer',
          `Your ride is in ${window.label}`,
          `Your booking ${job.bookingRef} from ${job.pickupAddress} is confirmed in ${window.label}.`,
          'booking',
        );
      }
    }
  }
}

async function expireStaleOffers() {
  const now = new Date();
  const stale = await prisma.rideOffer.findMany({
    where: { status: 'pending', expiresAt: { lt: now } },
    select: { id: true, driverId: true, jobId: true },
  });

  if (stale.length === 0) return;

  await prisma.rideOffer.updateMany({
    where: { id: { in: stale.map(o => o.id) } },
    data: { status: 'expired' },
  });

  // Notify drivers whose offers expired so the mobile app can update UI
  for (const offer of stale) {
    await pushNotification(
      offer.driverId,
      'driver',
      'Ride offer expired',
      'A ride offer has expired. Stay available for new offers.',
      'job',
    );
  }
}

export function startReminderScheduler() {
  cron.schedule('* * * * *', () => {
    sendRideReminders().catch(err =>
      console.error('[Reminders] Failed to send ride reminders:', err),
    );
    expireStaleOffers().catch(err =>
      console.error('[Reminders] Failed to expire stale offers:', err),
    );
  });
  console.log('[Reminders] Ride reminder scheduler started');
}
