import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { jobService } from '@/services/jobService';
import { JobCard } from '@/components/cards/JobCard';
import type { Job } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function NewJobsScreen() {
  const { affiliate } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await jobService.getNewJobs();
    setJobs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (jobId: string) => {
    await jobService.acceptJob(jobId, affiliate?.id ?? 'aff_001');
    load();
  };

  const handleReject = async (jobId: string) => {
    await jobService.rejectJob(jobId);
    load();
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>New Job Requests</Text>
          <Text style={styles.sub}>{jobs.length} job{jobs.length !== 1 ? 's' : ''} awaiting your response</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ROSE_GOLD} size="large" />
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No New Jobs</Text>
          <Text style={styles.emptyText}>New ride requests will appear here once a customer accepts a quote.</Text>
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
              showActions
              onPress={() => router.push({ pathname: '/job-details', params: { jobId: item.id, context: 'affiliate' } })}
              onAccept={() => handleAccept(item.id)}
              onReject={() => handleReject(item.id)}
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
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: LINE,
  },
  title: { fontSize: 22, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  sub: { fontSize: 13, color: MUTED, marginTop: 2, fontFamily: FONT_REGULAR ?? undefined },
  refreshBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { fontSize: 24, color: ROSE_GOLD },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: TEXT, marginBottom: 10, fontFamily: FONT_MEDIUM ?? undefined },
  emptyText: { color: MUTED, fontSize: 14, textAlign: 'center', lineHeight: 22, fontFamily: FONT_REGULAR ?? undefined },
});
