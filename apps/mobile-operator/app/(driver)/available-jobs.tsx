import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { jobService } from '@/services/jobService';
import { JobCard } from '@/components/cards/JobCard';
import type { Job } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function AvailableJobsScreen() {
  const { user, driver } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const isAffiliate = user?.role === 'affiliateDriver';
  const isIndependent = user?.role === 'independentDriver';

  const load = useCallback(async () => {
    setLoading(true);
    let data: Job[];
    if (isAffiliate) {
      data = await jobService.getDriverJobs(driver?.id ?? '');
      data = data.filter((j) => j.status === 'driver_assigned' || j.status === 'vehicle_assigned');
    } else {
      data = await jobService.getOpenJobs();
    }
    setJobs(data);
    setLoading(false);
  }, [isAffiliate, driver?.id]);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (jobId: string) => {
    if (isIndependent) {
      await jobService.claimJob(jobId);
    } else {
      await jobService.driverAcceptJob(jobId);
    }
    load();
  };

  const screenTitle = isAffiliate ? 'Assigned Jobs' : 'Available Jobs';
  const emptyMessage = isAffiliate
    ? 'No jobs have been assigned to you by your affiliate yet.'
    : 'No open jobs available at this time. Check back soon.';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{screenTitle}</Text>
          <Text style={styles.sub}>
            {isAffiliate
              ? 'Jobs assigned to you by your affiliate'
              : 'Open jobs from Ride Prestige — accept or decline'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Driver type badge */}
      <View style={styles.typeBadgeBar}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {isAffiliate ? '🏢 Affiliate Driver — Assigned Jobs Only' : '🚗 Independent Driver — Open Jobs'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>
      ) : jobs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Jobs Available</Text>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              showActions={isIndependent || item.status === 'driver_assigned' || item.status === 'vehicle_assigned'}
              onPress={() => router.push({ pathname: '/job-details', params: { jobId: item.id, context: 'driver' } })}
              onAccept={() => handleAccept(item.id)}
              onReject={() => { /* driver declines — not implemented in mock */ }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: LINE,
  },
  title: { fontSize: 22, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  sub: { fontSize: 13, color: MUTED, marginTop: 2, fontFamily: FONT_REGULAR ?? undefined },
  refreshBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { fontSize: 24, color: ROSE_GOLD },
  typeBadgeBar: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: LINE },
  typeBadge: { backgroundColor: 'rgba(215,180,106,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  typeBadgeText: { color: ROSE_GOLD, fontSize: 12, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: TEXT, marginBottom: 10, fontFamily: FONT_MEDIUM ?? undefined },
  emptyText: { color: MUTED, fontSize: 14, textAlign: 'center', lineHeight: 22, fontFamily: FONT_REGULAR ?? undefined },
});
