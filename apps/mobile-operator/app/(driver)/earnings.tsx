import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { earningsService } from '@/services/earningsService';
import type { EarningsSummary } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function DriverEarningsScreen() {
  const { driver } = useAuth();
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    earningsService.getDriverEarnings(driver?.id ?? '').then((data) => {
      setEarnings(data);
      setLoading(false);
    });
  }, [driver?.id]);

  if (loading) return <View style={{ flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>My Earnings</Text>
        <Text style={styles.sub}>{driver?.fullName}</Text>
      </View>

      <FlatList
        data={earnings?.entries ?? []}
        keyExtractor={(e) => e.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.summaryGrid}>
              <SummaryCard label="Today" value={formatCurrency(earnings!.todayEarnings)} accent />
              <SummaryCard label="This Week" value={formatCurrency(earnings!.weeklyEarnings)} />
            </View>
            <View style={styles.summaryGrid}>
              <SummaryCard label="This Month" value={formatCurrency(earnings!.monthlyEarnings)} />
              <SummaryCard label="Total Earned" value={formatCurrency(earnings!.totalEarnings)} />
            </View>
            <View style={styles.summaryGrid}>
              <SummaryCard label="Jobs Done" value={String(earnings!.completedJobs)} />
              <SummaryCard label="Pending Payout" value={formatCurrency(earnings!.pendingPayout)} accent />
            </View>
            <Text style={styles.sectionLabel}>RECENT PAYOUTS</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={styles.entryLeft}>
              <Text style={styles.entryRef}>{item.bookingRef}</Text>
              <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.entryRight}>
              <Text style={styles.entryNet}>{formatCurrency(item.netAmount)}</Text>
              <StatusBadge
                label={item.status.toUpperCase()}
                color={item.status === 'paid' ? '#4CAF50' : item.status === 'processing' ? '#FF9800' : '#B8B0A4'}
              />
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={{ color: MUTED, textAlign: 'center', marginTop: 20, fontFamily: FONT_REGULAR ?? undefined }}>No payout history yet.</Text>}
      />
    </View>
  );
}

function SummaryCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[summaryStyles.card, accent && summaryStyles.cardAccent]}>
      <Text style={[summaryStyles.value, accent && summaryStyles.valueAccent]}>{value}</Text>
      <Text style={summaryStyles.label}>{label}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE, padding: 14 },
  cardAccent: { borderColor: 'rgba(215,180,106,0.4)', backgroundColor: 'rgba(215,180,106,0.06)' },
  value: { fontSize: 20, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  valueAccent: { color: ROSE_GOLD },
  label: { fontSize: 12, color: MUTED, marginTop: 3, fontFamily: FONT_REGULAR ?? undefined },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: LINE },
  title: { fontSize: 22, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  sub: { fontSize: 13, color: MUTED, marginTop: 2, fontFamily: FONT_REGULAR ?? undefined },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  summaryGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  sectionLabel: { fontSize: 11, color: MUTED, letterSpacing: 1.2, fontWeight: '600', marginVertical: 14, fontFamily: FONT_MEDIUM ?? undefined },
  entryCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: LINE, padding: 14, marginBottom: 8,
  },
  entryLeft: { gap: 3 },
  entryRef: { fontSize: 13, fontWeight: '600', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  entryDate: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  entryRight: { alignItems: 'flex-end', gap: 4 },
  entryNet: { fontSize: 18, fontWeight: '700', color: ROSE_GOLD, fontFamily: FONT_MEDIUM ?? undefined },
});
