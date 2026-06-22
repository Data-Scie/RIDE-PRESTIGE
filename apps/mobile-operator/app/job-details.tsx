import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { jobService } from '@/services/jobService';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Job } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, CARD_2, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { jobStatusLabel, jobStatusColor, formatCurrency, formatDateTime } from '@/utils/helpers';
import { useAuth } from '@/context/AuthContext';

export default function JobDetailsScreen() {
  const { jobId, context } = useLocalSearchParams<{ jobId: string; context?: string }>();
  const { affiliate, driver } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    (context === 'driver' ? jobService.getDriverJobById(jobId) : jobService.getJobById(jobId)).then((j) => {
      setJob(j ?? null);
      setLoading(false);
    });
  }, [jobId]);

  const handleAccept = async () => {
    if (!job) return;
    setActing(true);
    await jobService.acceptJob(job.id, affiliate?.id ?? 'aff_001');
    const updated = await jobService.getDriverJobById(job.id);
    setJob(updated ?? null);
    setActing(false);
    Alert.alert('Job Accepted', 'The job has been accepted. Please allocate a driver and vehicle.');
  };

  const handleReject = async () => {
    if (!job) return;
    Alert.alert('Reject Job', 'Are you sure you want to reject this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          setActing(true);
          await jobService.rejectJob(job.id);
          router.back();
        },
      },
    ]);
  };

  const handleDriverAccept = async () => {
    if (!job) return;
    setActing(true);
    await jobService.driverAcceptJob(job.id);
    const updated = await jobService.getDriverJobById(job.id);
    setJob(updated ?? null);
    setActing(false);
  };

  const handleStatusUpdate = async (status: Job['status']) => {
    if (!job) return;
    setActing(true);
    await jobService.updateRideStatus(job.id, status);
    const updated = context === 'driver' ? await jobService.getDriverJobById(job.id) : await jobService.getJobById(job.id);
    setJob(updated ?? null);
    setActing(false);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>;
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{ color: TEXT }}>Job not found.</Text>
      </View>
    );
  }

  const isAffiliate = context === 'affiliate';
  const isDriver = context === 'driver';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Ref & status */}
        <View style={styles.refRow}>
          <Text style={styles.ref}>{job.bookingRef}</Text>
          <StatusBadge label={jobStatusLabel(job.status)} color={jobStatusColor(job.status)} />
        </View>

        {/* Customer */}
        <InfoSection title="Customer Details">
          <InfoRow label="Name" value={job.customerName} />
          <InfoRow label="Phone" value={job.customerPhone} />
          <InfoRow label="Passengers" value={String(job.passengerCount)} />
          <InfoRow label="Luggage" value={String(job.luggageCount)} />
        </InfoSection>

        {/* Route */}
        <InfoSection title="Journey Details">
          <InfoRow label="Pickup" value={job.pickupAddress} />
          {job.stops.map((s, i) => (
            <InfoRow key={s.id} label={`Stop ${i + 1}`} value={s.address} />
          ))}
          <InfoRow label="Drop-off" value={job.dropoffAddress} />
          <InfoRow label="Date & Time" value={formatDateTime(job.dateTime)} />
          <InfoRow label="Distance" value={job.distance} />
          <InfoRow label="Duration" value={job.estimatedDuration} />
          {job.flightNumber && <InfoRow label="Flight No." value={job.flightNumber} />}
          {job.trainNumber && <InfoRow label="Train No." value={job.trainNumber} />}
          {job.specialInstructions && <InfoRow label="Instructions" value={job.specialInstructions} />}
        </InfoSection>

        {/* Vehicle */}
        <InfoSection title="Vehicle Requirements">
          <InfoRow label="Vehicle Type" value={job.vehicleTypeRequested} />
          {job.assignedVehicleId && <InfoRow label="Assigned Vehicle" value={job.assignedVehicleId} />}
          {job.assignedDriverId && <InfoRow label="Assigned Driver" value={job.assignedDriverId} />}
        </InfoSection>

        {/* Financials */}
        <InfoSection title="Fare Details">
          <InfoRow label="Total Fare" value={formatCurrency(job.fareAmount)} highlight />
          {isAffiliate && (
            <>
              <InfoRow label="Platform Commission" value={`- ${formatCurrency(job.commissionAmount)}`} />
              <InfoRow label="Affiliate Payout" value={formatCurrency(job.affiliatePayoutAmount)} highlight />
            </>
          )}
          {isDriver && (
            <InfoRow label="Driver Payout" value={formatCurrency(job.driverPayoutAmount)} highlight />
          )}
        </InfoSection>

        {/* Actions */}
        {acting && <ActivityIndicator color={ROSE_GOLD} style={{ marginVertical: 12 }} />}

        {isAffiliate && job.status === 'awaiting_affiliate' && !acting && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnReject} onPress={handleReject} activeOpacity={0.8}>
              <Text style={styles.btnRejectText}>Reject Job</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAccept} onPress={handleAccept} activeOpacity={0.8}>
              <Text style={styles.btnAcceptText}>Accept Job</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAffiliate && job.status === 'needs_allocation' && !acting && (
          <TouchableOpacity
            style={styles.btnAllocate}
            onPress={() => router.push({ pathname: '/allocate-driver', params: { jobId: job.id } })}
            activeOpacity={0.8}
          >
            <Text style={styles.btnAllocateText}>Allocate Driver & Vehicle →</Text>
          </TouchableOpacity>
        )}

        {isDriver && job.status === 'driver_assigned' && !acting && (
          <View style={styles.waitingNotice}>
            <Text style={styles.waitingNoticeText}>Waiting for your affiliate to allocate a vehicle before you can accept</Text>
          </View>
        )}

        {isDriver && job.status === 'vehicle_assigned' && !acting && (
          <TouchableOpacity style={styles.btnAccept} onPress={handleDriverAccept} activeOpacity={0.8}>
            <Text style={styles.btnAcceptText}>Accept Assignment</Text>
          </TouchableOpacity>
        )}

        {isDriver && job.status === 'driver_accepted' && !acting && (
          <TouchableOpacity
            style={styles.btnAccept}
            onPress={() => handleStatusUpdate('on_route')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnAcceptText}>Start Journey — On Route to Pickup</Text>
          </TouchableOpacity>
        )}

        {isDriver && job.status === 'on_route' && !acting && (
          <TouchableOpacity
            style={styles.btnAccept}
            onPress={() => handleStatusUpdate('arrived_pickup')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnAcceptText}>Arrived at Pickup Location</Text>
          </TouchableOpacity>
        )}

        {isDriver && job.status === 'arrived_pickup' && !acting && (
          <TouchableOpacity
            style={styles.btnAccept}
            onPress={() => handleStatusUpdate('passenger_onboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnAcceptText}>Passenger On Board</Text>
          </TouchableOpacity>
        )}

        {isDriver && job.status === 'passenger_onboard' && !acting && (
          <TouchableOpacity
            style={styles.btnAccept}
            onPress={() => handleStatusUpdate('completed')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnAcceptText}>Complete Ride</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.card}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, highlight && rowStyles.highlight]}>{value}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  title: { fontSize: 11, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 1, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
  card: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE, overflow: 'hidden' },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: LINE,
  },
  label: { fontSize: 13, color: MUTED, flex: 1, fontFamily: FONT_REGULAR ?? undefined },
  value: { fontSize: 13, color: TEXT, flex: 1, textAlign: 'right', fontWeight: '500', fontFamily: FONT_MEDIUM ?? undefined },
  highlight: { color: ROSE_GOLD, fontWeight: '700' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  ref: { fontSize: 14, fontWeight: '700', color: ROSE_GOLD, letterSpacing: 1, fontFamily: FONT_MEDIUM ?? undefined },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnReject: {
    flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(229,57,53,0.1)', borderWidth: 1, borderColor: 'rgba(229,57,53,0.4)',
  },
  btnRejectText: { color: '#E53935', fontWeight: '600', fontSize: 15, fontFamily: FONT_MEDIUM ?? undefined },
  btnAccept: {
    flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: ROSE_GOLD,
  },
  btnAcceptText: { color: BLACK, fontWeight: '700', fontSize: 15, fontFamily: FONT_MEDIUM ?? undefined },
  btnAllocate: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(215,180,106,0.12)', borderWidth: 1, borderColor: ROSE_GOLD, marginTop: 8,
  },
  btnAllocateText: { color: ROSE_GOLD, fontWeight: '700', fontSize: 15, fontFamily: FONT_MEDIUM ?? undefined },
  waitingNotice: {
    padding: 14, borderRadius: 14, marginTop: 8,
    backgroundColor: 'rgba(215,180,106,0.12)', borderWidth: 1, borderColor: 'rgba(215,180,106,0.4)',
  },
  waitingNoticeText: { color: ROSE_GOLD, fontWeight: '600', fontSize: 13, textAlign: 'center', fontFamily: FONT_MEDIUM ?? undefined },
});
