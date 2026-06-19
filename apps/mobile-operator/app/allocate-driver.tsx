import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { driverService } from '@/services/driverService';
import { jobService } from '@/services/jobService';
import { DriverCard } from '@/components/cards/DriverCard';
import type { Driver } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function AllocateDriverScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { affiliate } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    driverService.getAvailableDrivers(affiliate?.id ?? 'aff_001', jobId)
      .then(setDrivers)
      .catch((error) => Alert.alert('Could not load drivers', error instanceof Error ? error.message : 'Please try again.'))
      .finally(() => setLoading(false));
  }, [affiliate?.id, jobId]);

  const handleAssign = async (driverId: string, driverName: string) => {
    Alert.alert(
      'Assign Driver',
      `Assign ${driverName} to job ${jobId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign', onPress: async () => {
            setAssigning(true);
            try {
              await jobService.assignDriver(jobId, driverId);
              Alert.alert('Driver Assigned', `${driverName} has been assigned to this job.`, [
                {
                  text: 'Assign Vehicle', onPress: () =>
                    router.replace({ pathname: '/allocate-vehicle', params: { jobId } }),
                },
                { text: 'Done', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Assignment Failed', error instanceof Error ? error.message : 'Please try another driver.');
            } finally {
              setAssigning(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.subHeader}>
        <Text style={styles.subTitle}>Job: {jobId}</Text>
        <Text style={styles.subNote}>Select an available driver to assign to this job</Text>
      </View>

      {loading || assigning ? (
        <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DriverCard
              driver={item}
              showAssignButton
              onAssign={() => handleAssign(item.id, item.fullName)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyTitle}>No Available Drivers</Text>
              <Text style={styles.emptyText}>All drivers are currently busy or offline.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  subHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: LINE },
  subTitle: { fontSize: 14, color: ROSE_GOLD, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  subNote: { fontSize: 13, color: MUTED, marginTop: 3, fontFamily: FONT_REGULAR ?? undefined },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: TEXT, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
  emptyText: { color: MUTED, textAlign: 'center', fontFamily: FONT_REGULAR ?? undefined },
});
