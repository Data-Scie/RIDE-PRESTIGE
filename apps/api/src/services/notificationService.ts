import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/db';
import type { PortalRole } from '../types';
import { emitToRoom } from '../lib/socket';

export async function pushNotification(
  recipientId: string,
  recipientRole: PortalRole,
  title: string,
  body: string,
  type: 'job' | 'system' | 'earnings' | 'document' | 'booking',
): Promise<void> {
  const notification = await prisma.notification.create({
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
  emitToRoom(`${recipientRole}:${recipientId}`, 'notification:new', {
    ...notification,
    createdAt: notification.createdAt.toISOString(),
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
