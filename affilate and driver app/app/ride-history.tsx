import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { jobService } from '@/services/jobService';
import type { Job } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { formatDateTime, formatCurrency } from '@/utils/helpers';

export default function RideHistoryScreen() {
  const { driver } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobService.getDriverJobs(driver?.id ?? 'drv_001').then((data) => {
      setJobs(data.filter((j) => j.status === 'completed' || j.status === 'cancelled'));
      setLoading(false);
    });
  }, [driver?.id]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.ref}>{item.bookingRef}</Text>
                <Text style={[styles.status, { color: item.status === 'completed' ? '#4CAF50' : '#E53935' }]}>
                  {item.status === 'completed' ? '✓ Completed' : '✗ Cancelled'}
                </Text>
              </View>
              <Text style={styles.customer}>{item.customerName}</Text>
              <Text style={styles.route} numberOfLines={1}>{item.pickupAddress} → {item.dropoffAddress}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.dateTime}>{formatDateTime(item.dateTime)}</Text>
                <Text style={styles.payout}>{formatCurrency(item.driverPayoutAmount)}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🕐</Text>
              <Text style={styles.emptyTitle}>No Ride History</Text>
              <Text style={styles.emptyText}>Completed and cancelled rides will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  card: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  ref: { fontSize: 12, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 0.8, fontFamily: FONT_MEDIUM ?? undefined },
  status: { fontSize: 12, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  customer: { fontSize: 15, fontWeight: '600', color: TEXT, marginBottom: 4, fontFamily: FONT_MEDIUM ?? undefined },
  route: { fontSize: 12, color: MUTED, marginBottom: 8, fontFamily: FONT_REGULAR ?? undefined },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  dateTime: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  payout: { fontSize: 16, color: ROSE_GOLD, fontWeight: '700', fontFamily: FONT_MEDIUM ?? undefined },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: TEXT, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
  emptyText: { color: MUTED, textAlign: 'center', fontFamily: FONT_REGULAR ?? undefined },
});
