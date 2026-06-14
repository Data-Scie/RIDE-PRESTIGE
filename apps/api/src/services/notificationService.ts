import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/db';
import type { PortalRole } from '../types';

export async function pushNotification(
  recipientId: string,
  recipientRole: PortalRole,
  title: string,
  body: string,
  type: 'job' | 'system' | 'earnings' | 'document' | 'booking',
): Promise<void> {
  await prisma.notification.create({
    data: {
      id: `notif-${uuid()}`,
      recipientId,
      recipientRole,
      title,
      body,
      type,
      isRead: false,
    },
  });
}

export async function getNotifications(recipientId: string) {
  return prisma.notification.findMany({
    where: { recipientId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markRead(notificationId: string, recipientId: string): Promise<boolean> {
  const n = await prisma.notification.findFirst({ where: { id: notificationId, recipientId } });
  if (!n) return false;
  await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  return true;
}

export async function markAllRead(recipientId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { recipientId }, data: { isRead: true } });
}
