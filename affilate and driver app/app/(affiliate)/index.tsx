import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { affiliateService } from '@/services/affiliateService';
import { DashboardCard } from '@/components/cards/DashboardCard';
import { SectionHeader } from '@/components/layout/SectionHeader';
import {
  BLACK, BLACK_2, ROSE_GOLD, ROSE_GOLD_2, TEXT, MUTED, CARD, CARD_2, LINE, FONT_MEDIUM, FONT_REGULAR,
} from '@/constants/theme';
import { formatCurrency } from '@/utils/helpers';

interface Stats {
  newJobs: number;
  acceptedJobs: number;
  driversAvailable: number;
  vehiclesAvailable: number;
  todayEarnings: number;
  pendingAllocations: number;
}

export default function AffiliateDashboard() {
  const { user, affiliate, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    affiliateService.getDashboardStats(affiliate?.id ?? '').then(setStats);
  }, [affiliate?.id]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.companyName}>{affiliate?.companyName ?? user?.name}</Text>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.avatarInitials ?? 'AF'}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Pending allocation alert */}
        {(stats?.pendingAllocations ?? 0) > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push('/(affiliate)/accepted-jobs')}
            activeOpacity={0.8}
          >
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertText}>
              {stats!.pendingAllocations} job{stats!.pendingAllocations > 1 ? 's' : ''} need driver allocation
            </Text>
            <Text style={styles.alertArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Stats grid */}
        <SectionHeader title="Today's Overview" />
        <View style={styles.grid}>
          <DashboardCard
            label="New Requests"
            value={stats?.newJobs ?? '—'}
            icon="📋"
            onPress={() => router.push('/(affiliate)/new-jobs')}
          />
          <DashboardCard
            label="Accepted Jobs"
            value={stats?.acceptedJobs ?? '—'}
            icon="✅"
            onPress={() => router.push('/(affiliate)/accepted-jobs')}
          />
        </View>
        <View style={styles.grid}>
          <DashboardCard
            label="Drivers Available"
            value={stats?.driversAvailable ?? '—'}
            icon="👤"
            onPress={() => router.push('/(affiliate)/drivers')}
          />
          <DashboardCard
            label="Vehicles Available"
            value={stats?.vehiclesAvailable ?? '—'}
            icon="🚗"
            onPress={() => router.push('/(affiliate)/vehicles')}
          />
        </View>
        <View style={styles.grid}>
          <DashboardCard
            label="Today's Earnings"
            value={stats ? formatCurrency(stats.todayEarnings) : '—'}
            icon="💷"
            accent
            onPress={() => router.push('/(affiliate)/earnings')}
          />
          <DashboardCard
            label="Pending Allocation"
            value={stats?.pendingAllocations ?? '—'}
            icon="⏳"
          />
        </View>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActions}>
          {[
            { label: 'View New Jobs', icon: '📋', route: '/(affiliate)/new-jobs' },
            { label: 'Manage Drivers', icon: '👤', route: '/(affiliate)/drivers' },
            { label: 'Manage Vehicles', icon: '🚗', route: '/(affiliate)/vehicles' },
            { label: 'Earnings Report', icon: '💷', route: '/(affiliate)/earnings' },
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

        {/* Account info */}
        <SectionHeader title="Account" />
        <View style={styles.accountCard}>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Company</Text>
            <Text style={styles.accountValue}>{affiliate?.companyName}</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Service Areas</Text>
            <Text style={styles.accountValue}>{affiliate?.serviceAreas.slice(0, 3).join(', ')}</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Total Jobs</Text>
            <Text style={styles.accountValue}>{affiliate?.totalJobs}</Text>
          </View>
          <View style={[styles.accountRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.accountLabel}>Rating</Text>
            <Text style={styles.accountValue}>⭐ {affiliate?.rating.toFixed(1)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

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
  greeting: { fontSize: 13, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  companyName: { fontSize: 18, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: BLACK_2, borderWidth: 1, borderColor: LINE,
    alignItems: 'center', justifyContent: 'center',
  },
  notifIcon: { fontSize: 18 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(215,180,106,0.15)', borderWidth: 1, borderColor: ROSE_GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: ROSE_GOLD, fontWeight: '700', fontSize: 14, fontFamily: FONT_MEDIUM ?? undefined },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(201,162,74,0.12)', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(201,162,74,0.4)', padding: 14, marginBottom: 16,
  },
  alertIcon: { fontSize: 18 },
  alertText: { flex: 1, color: ROSE_GOLD, fontWeight: '600', fontSize: 14, fontFamily: FONT_MEDIUM ?? undefined },
  alertArrow: { color: ROSE_GOLD, fontSize: 20 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  quickActions: { gap: 8, marginBottom: 8 },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: LINE,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  quickActionIcon: { fontSize: 20 },
  quickActionLabel: { flex: 1, fontSize: 15, color: TEXT, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  quickActionArrow: { color: ROSE_GOLD, fontSize: 20 },
  accountCard: {
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE,
    overflow: 'hidden', marginBottom: 16,
  },
  accountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: LINE,
  },
  accountLabel: { fontSize: 13, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  accountValue: { fontSize: 13, color: TEXT, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  logoutBtn: {
    height: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(229,57,53,0.35)',
    backgroundColor: 'rgba(229,57,53,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  logoutText: { color: '#E53935', fontWeight: '600', fontSize: 15, fontFamily: FONT_MEDIUM ?? undefined },
});
