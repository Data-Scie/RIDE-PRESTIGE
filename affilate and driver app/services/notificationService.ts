import type { Notification } from '@/types';
import { api } from './apiClient';

export const notificationService = {
  async getNotifications(role: 'driver' | 'affiliate'): Promise<Notification[]> {
    const path = role === 'driver' ? '/api/driver/notifications' : '/api/affiliate/notifications';
    const r = await api.get<{ success: boolean; data: Notification[] }>(path);
    return r.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAllAsRead(role: 'driver' | 'affiliate'): Promise<void> {
    const path = role === 'driver'
      ? '/api/driver/notifications/read-all'
      : '/api/affiliate/notifications/read-all';
    await api.put(path, {});
  },

  getUnreadCount(notifications: Notification[]): number {
    return notifications.filter(n => !n.isRead).length;
  },
};
