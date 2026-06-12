import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Job } from '@/types';
import { CARD, LINE, TEXT, MUTED, ROSE_GOLD, FONT_MEDIUM, FONT_REGULAR, CARD_2 } from '@/constants/theme';
import { StatusBadge } from '@/components/common/StatusBadge';
import { jobStatusLabel, jobStatusColor, formatDateTime, formatCurrency } from '@/utils/helpers';

interface JobCardProps {
  job: Job;
  onPress?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export function JobCard({ job, onPress, onAccept, onReject, showActions = false }: JobCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.header}>
        <Text style={styles.ref}>{job.bookingRef}</Text>
        <StatusBadge label={jobStatusLabel(job.status)} color={jobStatusColor(job.status)} />
      </View>

      <Text style={styles.customer}>{job.customerName}</Text>

      <View style={styles.route}>
        <View style={styles.routeRow}>
          <Text style={styles.routeDot}>●</Text>
          <Text style={styles.routeText} numberOfLines={1}>{job.pickupAddress}</Text>
        </View>
        {job.stops.map((s) => (
          <View key={s.id} style={styles.routeRow}>
            <Text style={[styles.routeDot, { color: MUTED }]}>◎</Text>
            <Text style={[styles.routeText, { color: MUTED }]} numberOfLines={1}>{s.address}</Text>
          </View>
        ))}
        <View style={styles.routeRow}>
          <Text style={[styles.routeDot, { color: ROSE_GOLD }]}>■</Text>
          <Text style={styles.routeText} numberOfLines={1}>{job.dropoffAddress}</Text>
        </View>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaItem}>📅 {formatDateTime(job.dateTime)}</Text>
        <Text style={styles.metaItem}>👤 {job.passengerCount} pax · 🧳 {job.luggageCount}</Text>
        <Text style={styles.metaItem}>🚗 {job.vehicleTypeRequested} · {job.distance}</Text>
      </View>

      <View style={styles.fareRow}>
        <Text style={styles.fareLabel}>Fare</Text>
        <Text style={styles.fare}>{formatCurrency(job.fareAmount)}</Text>
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}>
            <Text style={styles.btnRejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={onAccept}>
            <Text style={styles.btnAcceptText}>Accept Job</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    padding: 16,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ref: { fontSize: 12, fontWeight: '700', color: ROSE_GOLD, letterSpacing: 0.8, fontFamily: FONT_MEDIUM ?? undefined },
  customer: { fontSize: 17, fontWeight: '600', color: TEXT, marginBottom: 10, fontFamily: FONT_MEDIUM ?? undefined },
  route: { marginBottom: 10, gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  routeDot: { color: '#4CAF50', fontSize: 10, marginTop: 4, width: 14 },
  routeText: { flex: 1, fontSize: 13, color: TEXT, fontFamily: FONT_REGULAR ?? undefined },
  meta: { gap: 3, marginBottom: 10 },
  metaItem: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CARD_2,
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
  },
  fareLabel: { fontSize: 12, color: MUTED, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  fare: { fontSize: 20, color: ROSE_GOLD, fontWeight: '700', fontFamily: FONT_MEDIUM ?? undefined },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnReject: { backgroundColor: 'rgba(229,57,53,0.12)', borderWidth: 1, borderColor: 'rgba(229,57,53,0.4)' },
  btnRejectText: { color: '#E53935', fontWeight: '600', fontSize: 14, fontFamily: FONT_MEDIUM ?? undefined },
  btnAccept: { backgroundColor: ROSE_GOLD },
  btnAcceptText: { color: '#030303', fontWeight: '700', fontSize: 14, fontFamily: FONT_MEDIUM ?? undefined },
});
