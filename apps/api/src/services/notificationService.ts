import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/db';
import type { PortalRole } from '../types';
import { emitToRoom } from '../lib/socket';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function getExpoPushToken(recipientId: string, role: PortalRole): Promise<string | null> {
  if (role === 'driver') {
    const d = await prisma.driver.findUnique({ where: { id: recipientId }, select: { expoPushToken: true } });
    return d?.expoPushToken ?? null;
  }
  if (role === 'affiliate') {
    const a = await prisma.affiliate.findUnique({ where: { id: recipientId }, select: { expoPushToken: true } });
    return a?.expoPushToken ?? null;
  }
  if (role === 'customer') {
    const c = await prisma.customer.findUnique({ where: { id: recipientId }, select: { expoPushToken: true } });
    return c?.expoPushToken ?? null;
  }
  return null;
}

async function sendExpoPush(token: string, title: string, body: string): Promise<void> {
  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to: token, sound: 'default', title, body }),
  });
}

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

  // Expo push — fire-and-forget, push failures must not block the main flow
  getExpoPushToken(recipientId, recipientRole).then(token => {
    if (token) return sendExpoPush(token, title, body);
  }).catch(() => {});
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
