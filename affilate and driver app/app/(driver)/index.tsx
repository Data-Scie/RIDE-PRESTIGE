import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { driverService } from '@/services/driverService';
import { DashboardCard } from '@/components/cards/DashboardCard';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { BLACK, BLACK_2, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { formatCurrency } from '@/utils/helpers';

interface Stats {
  todayJobs: number;
  completedJobs: number;
  rating: number;
  documentsStatus: string;
  currentRideId: string | null;
}

export default function DriverDashboard() {
  const { user, driver } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    driverService.getDashboardStats(driver?.id ?? '').then(setStats);
  }, [driver?.id]);

  const isIndependent = user?.role === 'independentDriver';
  const isAffiliate = user?.role === 'affiliateDriver';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>
            {isIndependent ? '🚗 Independent Driver' : '🏢 Affiliate Driver'}
          </Text>
          <Text style={styles.name}>{driver?.fullName ?? user?.name}</Text>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.avatarInitials ?? 'DR'}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Status bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, { backgroundColor: driver?.status === 'available' ? '#4CAF50' : driver?.status === 'busy' ? '#FF9800' : '#B8B0A4' }]} />
            <Text style={styles.statusText}>
              {driver?.status === 'available' ? 'Available' : driver?.status === 'busy' ? 'On a Job' : 'Offline'}
            </Text>
          </View>
          <Text style={styles.ratingText}>⭐ {driver?.rating.toFixed(1) ?? '—'}</Text>
        </View>

        {/* Stats */}
        <SectionHeader title="Overview" />
        <View style={styles.grid}>
          <DashboardCard label="Today's Jobs" value={stats?.todayJobs ?? '—'} icon="📅" />
          <DashboardCard label="Total Completed" value={stats?.completedJobs ?? '—'} icon="✅" />
        </View>
        <View style={styles.grid}>
          <DashboardCard label="Rating" value={stats ? `⭐ ${stats.rating.toFixed(1)}` : '—'} icon="⭐" accent />
          <DashboardCard label="Documents" value={stats?.documentsStatus ?? '—'} icon="📄" />
        </View>

        {/* Current ride */}
        {stats?.currentRideId ? (
          <>
            <SectionHeader title="Active Ride" />
            <TouchableOpacity
              style={styles.activeRideCard}
              onPress={() => router.push('/(driver)/current-ride')}
              activeOpacity={0.8}
            >
              <Text style={styles.activeRideIcon}>🚗</Text>
              <View style={styles.activeRideInfo}>
                <Text style={styles.activeRideTitle}>Ride in Progress</Text>
                <Text style={styles.activeRideSub}>Tap to view ride details and update status</Text>
              </View>
              <Text style={styles.activeRideArrow}>›</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {/* Quick actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActions}>
          {[
            {
              label: isIndependent ? 'Available Jobs' : 'Assigned Jobs',
              icon: '📋',
              route: '/(driver)/available-jobs',
            },
            { label: 'My Jobs', icon: '✅', route: '/(driver)/my-jobs' },
            { label: 'Earnings', icon: '💷', route: '/(driver)/earnings' },
            { label: 'Documents', icon: '📄', route: '/documents' },
            { label: 'Ride History', icon: '🕐', route: '/ride-history' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickAction}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.75}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
              <Text style={styles.quickActionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Driver type info */}
        {isAffiliate && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🏢 You are registered as an Affiliate Driver under{' '}
              <Text style={styles.infoHighlight}>{driver?.affiliateId ?? 'your affiliate'}</Text>.
              You will only see jobs assigned by your affiliate.
            </Text>
          </View>
        )}
        {isIndependent && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🚗 You are an Independent Driver. You can accept open jobs offered directly by Ride Prestige.
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: LINE,
  },
  greeting: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  name: { fontSize: 18, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BLACK_2, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  notifIcon: { fontSize: 18 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(215,180,106,0.15)', borderWidth: 1, borderColor: ROSE_GOLD, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: ROSE_GOLD, fontWeight: '700', fontSize: 14, fontFamily: FONT_MEDIUM ?? undefined },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  statusBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: LINE,
    paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: TEXT, fontSize: 14, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  ratingText: { color: ROSE_GOLD, fontWeight: '600', fontSize: 14, fontFamily: FONT_MEDIUM ?? undefined },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  activeRideCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(215,180,106,0.1)', borderRadius: 16, borderWidth: 1, borderColor: ROSE_GOLD,
    padding: 14, marginBottom: 8,
  },
  activeRideIcon: { fontSize: 28 },
  activeRideInfo: { flex: 1 },
  activeRideTitle: { fontSize: 15, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  activeRideSub: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  activeRideArrow: { color: ROSE_GOLD, fontSize: 20 },
  quickActions: { gap: 8, marginBottom: 16 },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: LINE,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  quickActionIcon: { fontSize: 20 },
  quickActionLabel: { flex: 1, fontSize: 15, color: TEXT, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  quickActionArrow: { color: ROSE_GOLD, fontSize: 20 },
  infoBox: { backgroundColor: 'rgba(215,180,106,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(215,180,106,0.2)', padding: 14 },
  infoText: { color: MUTED, fontSize: 13, lineHeight: 20, fontFamily: FONT_REGULAR ?? undefined },
  infoHighlight: { color: ROSE_GOLD, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
});
