import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { jobService } from '@/services/jobService';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Job } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { jobStatusLabel, jobStatusColor, formatDateTime, formatCurrency } from '@/utils/helpers';

export default function MyJobsScreen() {
  const { driver } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await jobService.getDriverJobs(driver?.id ?? 'drv_001');
    setJobs(data);
    setLoading(false);
  }, [driver?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
        <Text style={styles.sub}>{jobs.length} total assigned jobs</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/job-details', params: { jobId: item.id, context: 'driver' } })}
              activeOpacity={0.75}
            >
              <View style={styles.cardTop}>
                <Text style={styles.ref}>{item.bookingRef}</Text>
                <StatusBadge label={jobStatusLabel(item.status)} color={jobStatusColor(item.status)} />
              </View>
              <Text style={styles.customer}>{item.customerName}</Text>
              <Text style={styles.route} numberOfLines={1}>
                {item.pickupAddress} → {item.dropoffAddress}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.dateTime}>{formatDateTime(item.dateTime)}</Text>
                <Text style={styles.payout}>{formatCurrency(item.driverPayoutAmount)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>No Jobs Yet</Text>
              <Text style={styles.emptyText}>Your assigned and completed jobs will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: LINE },
  title: { fontSize: 22, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  sub: { fontSize: 13, color: MUTED, marginTop: 2, fontFamily: FONT_REGULAR ?? undefined },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  card: { backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: LINE, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ref: { fontSize: 12, fontWeight: '700', color: ROSE_GOLD, letterSpacing: 0.8, fontFamily: FONT_MEDIUM ?? undefined },
  customer: { fontSize: 16, fontWeight: '600', color: TEXT, marginBottom: 4, fontFamily: FONT_MEDIUM ?? undefined },
  route: { fontSize: 13, color: MUTED, marginBottom: 8, fontFamily: FONT_REGULAR ?? undefined },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateTime: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  payout: { fontSize: 18, color: ROSE_GOLD, fontWeight: '700', fontFamily: FONT_MEDIUM ?? undefined },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: TEXT, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
  emptyText: { color: MUTED, textAlign: 'center', lineHeight: 22, fontFamily: FONT_REGULAR ?? undefined },
});
