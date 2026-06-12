import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notificationService';
import type { Notification } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, CARD_2, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { formatDateTime } from '@/utils/helpers';

const TYPE_ICONS: Record<Notification['type'], string> = {
  job: '🚗',
  system: '⚙️',
  earnings: '💷',
  document: '📄',
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await notificationService.getNotifications(user?.id ?? '');
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(user?.id ?? '');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBar} onPress={handleMarkAllRead} activeOpacity={0.8}>
          <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notif, !item.isRead && styles.notifUnread]}
              onPress={() => handleMarkRead(item.id)}
              activeOpacity={0.75}
            >
              <View style={styles.notifIconWrap}>
                <Text style={styles.notifIcon}>{TYPE_ICONS[item.type]}</Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.notifTime}>{formatDateTime(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>You're all caught up!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  markAllBar: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(215,180,106,0.06)', borderBottomWidth: 1, borderBottomColor: LINE,
    alignItems: 'flex-end',
  },
  markAllText: { color: ROSE_GOLD, fontSize: 13, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  notif: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE,
    padding: 14, marginBottom: 8,
  },
  notifUnread: { borderColor: 'rgba(215,180,106,0.35)', backgroundColor: 'rgba(215,180,106,0.04)' },
  notifIconWrap: { position: 'relative' },
  notifIcon: { fontSize: 26 },
  unreadDot: {
    position: 'absolute', top: 0, right: -2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: ROSE_GOLD,
  },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: { fontSize: 14, color: MUTED, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  notifTitleUnread: { color: TEXT },
  notifBody: { fontSize: 13, color: MUTED, lineHeight: 19, fontFamily: FONT_REGULAR ?? undefined },
  notifTime: { fontSize: 11, color: MUTED, marginTop: 2, fontFamily: FONT_REGULAR ?? undefined },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: TEXT, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
  emptyText: { color: MUTED, textAlign: 'center', fontFamily: FONT_REGULAR ?? undefined },
});
