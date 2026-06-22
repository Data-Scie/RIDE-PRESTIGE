import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { jobService } from '@/services/jobService';
import type { Job, JobStatus } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { formatDateTime, formatCurrency } from '@/utils/helpers';

type RideStep = {
  status: JobStatus;
  label: string;
  description: string;
  buttonLabel?: string;
  nextStatus?: JobStatus;
};

const RIDE_TIMELINE: RideStep[] = [
  { status: 'driver_accepted', label: 'Job Accepted', description: 'You have accepted this ride assignment.', buttonLabel: 'Start Journey', nextStatus: 'on_route' },
  { status: 'on_route', label: 'On the Way', description: 'Heading to pickup location.', buttonLabel: 'Arrived at Pickup', nextStatus: 'arrived_pickup' },
  { status: 'arrived_pickup', label: 'Arrived at Pickup', description: 'You have arrived at the pickup location.', buttonLabel: 'Passenger On Board', nextStatus: 'passenger_onboard' },
  { status: 'passenger_onboard', label: 'Passenger On Board', description: 'Passenger has boarded the vehicle.', buttonLabel: 'Start Ride', nextStatus: 'in_progress' },
  { status: 'in_progress', label: 'Ride In Progress', description: 'Journey is in progress.', buttonLabel: 'Complete Ride', nextStatus: 'completed' },
  { status: 'completed', label: 'Ride Completed', description: 'Ride has been completed successfully.' },
];

export default function CurrentRideScreen() {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const loadActiveJob = async () => {
    setLoading(true);
    const active = await jobService.getCurrentJob();
    setJob(active);
    setLoading(false);
  };

  useEffect(() => { loadActiveJob(); }, []);

  const handleStatusUpdate = async (nextStatus: JobStatus) => {
    if (!job) return;
    if (nextStatus === 'completed') {
      Alert.alert('Complete Ride', 'Confirm ride completion?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete', onPress: async () => {
            setActing(true);
            await jobService.updateRideStatus(job.id, 'completed');
            await loadActiveJob();
            setActing(false);
          },
        },
      ]);
      return;
    }
    setActing(true);
    await jobService.updateRideStatus(job.id, nextStatus);
    await loadActiveJob();
    setActing(false);
  };

  const currentStep = RIDE_TIMELINE.find((s) => s.status === job?.status);
  const currentStepIndex = RIDE_TIMELINE.findIndex((s) => s.status === job?.status);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Current Ride</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>
      ) : !job ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>No Active Ride</Text>
          <Text style={styles.emptyText}>
            When you accept a job and start the journey, your active ride will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Booking info */}
          <View style={styles.bookingCard}>
            <Text style={styles.bookingRef}>{job.bookingRef}</Text>
            <Text style={styles.customerName}>{job.customerName}</Text>
            <Text style={styles.route}>{job.pickupAddress}</Text>
            <Text style={styles.routeArrow}>↓</Text>
            <Text style={styles.route}>{job.dropoffAddress}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>📅 {formatDateTime(job.dateTime)}</Text>
              <Text style={styles.payout}>{formatCurrency(job.driverPayoutAmount)}</Text>
            </View>
          </View>

          {/* Status timeline */}
          <Text style={styles.timelineTitle}>RIDE PROGRESS</Text>
          <View style={styles.timeline}>
            {RIDE_TIMELINE.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isFuture = idx > currentStepIndex;
              return (
                <View key={step.status} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineCircle,
                      isDone && styles.timelineCircleDone,
                      isCurrent && styles.timelineCircleCurrent,
                    ]}>
                      <Text style={styles.timelineCircleText}>
                        {isDone ? '✓' : idx + 1}
                      </Text>
                    </View>
                    {idx < RIDE_TIMELINE.length - 1 && (
                      <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                    )}
                  </View>
                  <View style={[styles.timelineContent, isFuture && styles.timelineContentFuture]}>
                    <Text style={[styles.timelineLabel, isDone && styles.timelineLabelDone, isCurrent && styles.timelineLabelCurrent]}>
                      {step.label}
                    </Text>
                    {isCurrent && <Text style={styles.timelineDesc}>{step.description}</Text>}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Action button */}
          {currentStep?.buttonLabel && !acting && job.status !== 'completed' && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleStatusUpdate(currentStep.nextStatus!)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>{currentStep.buttonLabel}</Text>
            </TouchableOpacity>
          )}
          {acting && <ActivityIndicator color={ROSE_GOLD} style={{ marginTop: 16 }} />}

          {job.status === 'completed' && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedIcon}>🎉</Text>
              <Text style={styles.completedText}>Ride Completed!</Text>
              <Text style={styles.completedSub}>
                Payout: {formatCurrency(job.driverPayoutAmount)}
              </Text>
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: LINE },
  title: { fontSize: 22, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: TEXT, marginBottom: 12, fontFamily: FONT_MEDIUM ?? undefined },
  emptyText: { color: MUTED, textAlign: 'center', fontSize: 14, lineHeight: 22, fontFamily: FONT_REGULAR ?? undefined },
  bookingCard: { backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: LINE, padding: 16, marginBottom: 20 },
  bookingRef: { fontSize: 12, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4, fontFamily: FONT_MEDIUM ?? undefined },
  customerName: { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 10, fontFamily: FONT_MEDIUM ?? undefined },
  route: { fontSize: 13, color: TEXT, fontFamily: FONT_REGULAR ?? undefined },
  routeArrow: { color: MUTED, fontSize: 16, marginVertical: 3, paddingLeft: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  meta: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  payout: { fontSize: 20, color: ROSE_GOLD, fontWeight: '700', fontFamily: FONT_MEDIUM ?? undefined },
  timelineTitle: { fontSize: 11, color: MUTED, letterSpacing: 1.2, fontWeight: '600', marginBottom: 12, fontFamily: FONT_MEDIUM ?? undefined },
  timeline: { marginBottom: 20 },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: CARD, borderWidth: 2, borderColor: LINE,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineCircleDone: { backgroundColor: 'rgba(76,175,80,0.2)', borderColor: '#4CAF50' },
  timelineCircleCurrent: { backgroundColor: 'rgba(215,180,106,0.2)', borderColor: ROSE_GOLD },
  timelineCircleText: { color: MUTED, fontSize: 11, fontWeight: '700', fontFamily: FONT_MEDIUM ?? undefined },
  timelineLine: { width: 2, flex: 1, backgroundColor: LINE, marginVertical: 2, minHeight: 16 },
  timelineLineDone: { backgroundColor: '#4CAF50' },
  timelineContent: { flex: 1, paddingBottom: 16, paddingTop: 4 },
  timelineContentFuture: { opacity: 0.4 },
  timelineLabel: { fontSize: 14, color: MUTED, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  timelineLabelDone: { color: '#4CAF50' },
  timelineLabelCurrent: { color: TEXT },
  timelineDesc: { color: MUTED, fontSize: 12, marginTop: 3, fontFamily: FONT_REGULAR ?? undefined },
  actionBtn: { height: 56, borderRadius: 18, backgroundColor: ROSE_GOLD, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  actionBtnText: { color: BLACK, fontWeight: '700', fontSize: 16, fontFamily: FONT_MEDIUM ?? undefined },
  completedBanner: { alignItems: 'center', padding: 24, gap: 8 },
  completedIcon: { fontSize: 48 },
  completedText: { fontSize: 22, fontWeight: '700', color: '#4CAF50', fontFamily: FONT_MEDIUM ?? undefined },
  completedSub: { fontSize: 16, color: ROSE_GOLD, fontFamily: FONT_MEDIUM ?? undefined },
});
