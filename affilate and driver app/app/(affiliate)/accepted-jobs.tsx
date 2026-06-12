import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { jobService } from '@/services/jobService';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Job } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { jobStatusLabel, jobStatusColor, formatDateTime, formatCurrency } from '@/utils/helpers';

const FILTER_OPTIONS = ['All', 'Needs Allocation', 'Assigned', 'In Progress', 'Completed'];

export default function AcceptedJobsScreen() {
  const { affiliate } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await jobService.getAcceptedJobs(affiliate?.id ?? 'aff_001');
    setJobs(data);
    setLoading(false);
  }, [affiliate?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = jobs.filter((j) => {
    if (filter === 'All') return true;
    if (filter === 'Needs Allocation') return j.status === 'needs_allocation';
    if (filter === 'Assigned') return j.status === 'driver_assigned' || j.status === 'vehicle_assigned' || j.status === 'driver_accepted';
    if (filter === 'In Progress') return ['on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress'].includes(j.status);
    if (filter === 'Completed') return j.status === 'completed' || j.status === 'cancelled';
    return true;
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Accepted Jobs</Text>
        <Text style={styles.sub}>{jobs.length} total</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <FlatList
          data={FILTER_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(f) => f}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
              onPress={() => setFilter(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>No Jobs</Text>
          <Text style={styles.emptyText}>Accepted jobs will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(j) => j.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/job-details', params: { jobId: item.id, context: 'affiliate' } })}
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
                <Text style={styles.fare}>{formatCurrency(item.affiliatePayoutAmount)}</Text>
              </View>

              {/* Allocation CTA */}
              {item.status === 'needs_allocation' && (
                <View style={styles.allocateBanner}>
                  <Text style={styles.allocateText}>⚠️ Needs driver & vehicle allocation</Text>
                  <TouchableOpacity
                    style={styles.allocateBtn}
                    onPress={() => router.push({ pathname: '/allocate-driver', params: { jobId: item.id } })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.allocateBtnText}>Allocate Now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  header: {
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: LINE,
  },
  title: { fontSize: 22, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  sub: { fontSize: 13, color: MUTED, marginTop: 2, fontFamily: FONT_REGULAR ?? undefined },
  filterRow: { borderBottomWidth: 1, borderBottomColor: LINE },
  filterList: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: LINE },
  filterChipActive: { backgroundColor: 'rgba(215,180,106,0.12)', borderColor: ROSE_GOLD },
  filterChipText: { color: MUTED, fontSize: 13, fontFamily: FONT_MEDIUM ?? undefined },
  filterChipTextActive: { color: ROSE_GOLD },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  card: {
    backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: LINE,
    padding: 16, marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ref: { fontSize: 12, fontWeight: '700', color: ROSE_GOLD, letterSpacing: 0.8, fontFamily: FONT_MEDIUM ?? undefined },
  customer: { fontSize: 16, fontWeight: '600', color: TEXT, marginBottom: 4, fontFamily: FONT_MEDIUM ?? undefined },
  route: { fontSize: 13, color: MUTED, marginBottom: 8, fontFamily: FONT_REGULAR ?? undefined },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateTime: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  fare: { fontSize: 18, color: ROSE_GOLD, fontWeight: '700', fontFamily: FONT_MEDIUM ?? undefined },
  allocateBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, padding: 10, borderRadius: 10,
    backgroundColor: 'rgba(201,162,74,0.1)', borderWidth: 1, borderColor: 'rgba(201,162,74,0.3)',
  },
  allocateText: { color: ROSE_GOLD, fontSize: 12, fontFamily: FONT_REGULAR ?? undefined, flex: 1 },
  allocateBtn: { backgroundColor: ROSE_GOLD, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  allocateBtnText: { color: BLACK, fontWeight: '700', fontSize: 12, fontFamily: FONT_MEDIUM ?? undefined },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: TEXT, marginBottom: 10, fontFamily: FONT_MEDIUM ?? undefined },
  emptyText: { color: MUTED, fontSize: 14, textAlign: 'center', fontFamily: FONT_REGULAR ?? undefined },
});
