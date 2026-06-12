import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Driver } from '@/types';
import { CARD, LINE, TEXT, MUTED, ROSE_GOLD, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { StatusBadge } from '@/components/common/StatusBadge';
import { driverStatusColor, documentStatusColor } from '@/utils/helpers';

interface DriverCardProps {
  driver: Driver;
  onPress?: () => void;
  onAssign?: () => void;
  showAssignButton?: boolean;
}

export function DriverCard({ driver, onPress, onAssign, showAssignButton = false }: DriverCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {driver.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{driver.fullName}</Text>
          <Text style={styles.meta}>{driver.phone}</Text>
          <View style={styles.badges}>
            <StatusBadge label={driver.status.toUpperCase()} color={driverStatusColor(driver.status)} />
            <StatusBadge label={`Docs: ${driver.documentsStatus}`} color={documentStatusColor(driver.documentsStatus)} />
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.rating}>⭐ {driver.rating.toFixed(1)}</Text>
          <Text style={styles.jobs}>{driver.totalJobs} jobs</Text>
        </View>
      </View>
      {showAssignButton && (
        <TouchableOpacity style={styles.assignBtn} onPress={onAssign}>
          <Text style={styles.assignText}>Assign Driver</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(215,180,106,0.15)',
    borderWidth: 1, borderColor: ROSE_GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: ROSE_GOLD, fontWeight: '700', fontSize: 16, fontFamily: FONT_MEDIUM ?? undefined },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '600', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  meta: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  badges: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  right: { alignItems: 'flex-end', gap: 4 },
  rating: { fontSize: 13, color: ROSE_GOLD, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  jobs: { fontSize: 11, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  assignBtn: { marginTop: 12, backgroundColor: ROSE_GOLD, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  assignText: { color: '#030303', fontWeight: '700', fontSize: 14, fontFamily: FONT_MEDIUM ?? undefined },
});
