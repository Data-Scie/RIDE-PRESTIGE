import { v4 as uuid } from 'uuid';
import { notifications } from '../data/store';
import type { PortalRole, Notification } from '../types';

export function pushNotification(
  recipientId: string,
  recipientRole: PortalRole,
  title: string,
  body: string,
  type: Notification['type'],
): Notification {
  const n: Notification = {
    id: `notif-${uuid()}`,
    recipientId,
    recipientRole,
    title,
    body,
    type,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(n);
  return n;
}

export function getNotifications(recipientId: string): Notification[] {
  return notifications.filter(n => n.recipientId === recipientId);
}

export function markRead(notificationId: string, recipientId: string): boolean {
  const n = notifications.find(n => n.id === notificationId && n.recipientId === recipientId);
  if (!n) return false;
  n.isRead = true;
  return true;
}

export function markAllRead(recipientId: string): void {
  notifications.filter(n => n.recipientId === recipientId).forEach(n => { n.isRead = true; });
}
