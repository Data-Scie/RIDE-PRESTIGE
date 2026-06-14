import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Vehicle } from '@/types';
import { CARD, LINE, TEXT, MUTED, ROSE_GOLD, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { StatusBadge } from '@/components/common/StatusBadge';
import { vehicleStatusColor, formatDate } from '@/utils/helpers';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
  onAssign?: () => void;
  showAssignButton?: boolean;
}

export function VehicleCard({ vehicle, onPress, onAssign, showAssignButton = false }: VehicleCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.header}>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{vehicle.vehicleType}</Text>
        </View>
        <StatusBadge label={vehicle.status.replace('_', ' ').toUpperCase()} color={vehicleStatusColor(vehicle.status)} />
      </View>
      <Text style={styles.name}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
      <Text style={styles.reg}>{vehicle.registration}</Text>
      <View style={styles.specRow}>
        <Text style={styles.spec}>👥 {vehicle.passengerCapacity} passengers</Text>
        <Text style={styles.spec}>🧳 {vehicle.luggageCapacity} luggage</Text>
        <Text style={styles.spec}>🎨 {vehicle.colour}</Text>
      </View>
      <View style={styles.expiryRow}>
        <Text style={styles.expiry}>MOT: {formatDate(vehicle.motExpiry)}</Text>
        <Text style={styles.expiry}>Ins: {formatDate(vehicle.insuranceExpiry)}</Text>
        <Text style={styles.expiry}>PHV: {formatDate(vehicle.phvLicenceExpiry)}</Text>
      </View>
      {showAssignButton && (
        <TouchableOpacity style={styles.assignBtn} onPress={onAssign}>
          <Text style={styles.assignText}>Assign Vehicle</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE, padding: 14, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeTag: { backgroundColor: 'rgba(215,180,106,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { color: ROSE_GOLD, fontSize: 11, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  name: { fontSize: 16, fontWeight: '600', color: TEXT, marginBottom: 2, fontFamily: FONT_MEDIUM ?? undefined },
  reg: { fontSize: 13, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 1, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
  specRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 6 },
  spec: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  expiryRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  expiry: { fontSize: 11, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  assignBtn: { marginTop: 12, backgroundColor: ROSE_GOLD, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  assignText: { color: '#030303', fontWeight: '700', fontSize: 14, fontFamily: FONT_MEDIUM ?? undefined },
});
