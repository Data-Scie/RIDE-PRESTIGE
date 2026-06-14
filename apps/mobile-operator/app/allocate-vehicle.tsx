import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { vehicleService } from '@/services/vehicleService';
import { jobService } from '@/services/jobService';
import { VehicleCard } from '@/components/cards/VehicleCard';
import type { Vehicle } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function AllocateVehicleScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { affiliate } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    vehicleService.getAvailableVehicles(affiliate?.id ?? 'aff_001').then((data) => {
      setVehicles(data);
      setLoading(false);
    });
  }, [affiliate?.id]);

  const handleAssign = async (vehicleId: string, vehicleName: string) => {
    Alert.alert(
      'Assign Vehicle',
      `Assign ${vehicleName} to job ${jobId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign', onPress: async () => {
            setAssigning(true);
            await jobService.assignVehicle(jobId, vehicleId);
            setAssigning(false);
            Alert.alert('Vehicle Assigned', `${vehicleName} has been assigned. The driver has been notified.`, [
              { text: 'Done', onPress: () => router.push('/(affiliate)/accepted-jobs') },
            ]);
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
        <Text style={styles.subNote}>Select an available vehicle for this job</Text>
      </View>

      {loading || assigning ? (
        <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              showAssignButton
              onAssign={() => handleAssign(item.id, `${item.year} ${item.make} ${item.model}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={styles.emptyTitle}>No Available Vehicles</Text>
              <Text style={styles.emptyText}>All vehicles are currently in use.</Text>
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
