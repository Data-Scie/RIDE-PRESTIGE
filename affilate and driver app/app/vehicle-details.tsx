import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { vehicleService } from '@/services/vehicleService';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Vehicle } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { vehicleStatusColor, formatDate } from '@/utils/helpers';

export default function VehicleDetailsScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vehicleService.getVehicleById(vehicleId).then((v) => {
      setVehicle(v ?? null);
      setLoading(false);
    });
  }, [vehicleId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>;
  if (!vehicle) return <View style={styles.center}><Text style={{ color: TEXT }}>Vehicle not found.</Text></View>;

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();
  const expiryColor = (dateStr: string) => isExpired(dateStr) ? '#E53935' : '#4CAF50';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleType}>{vehicle.vehicleType}</Text>
          <Text style={styles.vehicleName}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
          <Text style={styles.registration}>{vehicle.registration}</Text>
          <StatusBadge label={vehicle.status.replace('_', ' ').toUpperCase()} color={vehicleStatusColor(vehicle.status)} />
        </View>

        <SectionTitle title="Vehicle Details" />
        <InfoCard>
          <InfoRow label="Colour" value={vehicle.colour} />
          <InfoRow label="Passenger Capacity" value={`${vehicle.passengerCapacity} passengers`} />
          <InfoRow label="Luggage Capacity" value={`${vehicle.luggageCapacity} bags`} />
          <InfoRow label="Assigned Driver" value={vehicle.assignedDriverId ?? 'Not assigned'} />
        </InfoCard>

        <SectionTitle title="Compliance & Expiry Dates" />
        <InfoCard>
          <InfoRowColour label="MOT Expiry" value={formatDate(vehicle.motExpiry)} colour={expiryColor(vehicle.motExpiry)} />
          <InfoRowColour label="Insurance Expiry" value={formatDate(vehicle.insuranceExpiry)} colour={expiryColor(vehicle.insuranceExpiry)} />
          <InfoRowColour label="PHV Licence Expiry" value={formatDate(vehicle.phvLicenceExpiry)} colour={expiryColor(vehicle.phvLicenceExpiry)} />
        </InfoCard>

      </ScrollView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={{ fontSize: 11, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined }}>{title}</Text>;
}
function InfoCard({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE, overflow: 'hidden', marginBottom: 8 }}>{children}</View>;
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: LINE }}>
      <Text style={{ color: MUTED, fontSize: 13, flex: 1, fontFamily: FONT_REGULAR ?? undefined }}>{label}</Text>
      <Text style={{ color: TEXT, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right', fontFamily: FONT_MEDIUM ?? undefined }}>{value}</Text>
    </View>
  );
}
function InfoRowColour({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: LINE }}>
      <Text style={{ color: MUTED, fontSize: 13, flex: 1, fontFamily: FONT_REGULAR ?? undefined }}>{label}</Text>
      <Text style={{ color: colour, fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right', fontFamily: FONT_MEDIUM ?? undefined }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' },
  vehicleHeader: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  vehicleType: { fontSize: 12, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 1.5, fontFamily: FONT_MEDIUM ?? undefined },
  vehicleName: { fontSize: 22, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  registration: { fontSize: 16, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 2, fontFamily: FONT_MEDIUM ?? undefined },
});
