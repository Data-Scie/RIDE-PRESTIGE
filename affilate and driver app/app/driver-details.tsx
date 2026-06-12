import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { driverService } from '@/services/driverService';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Driver } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { driverStatusColor, documentStatusColor, formatDate } from '@/utils/helpers';

export default function DriverDetailsScreen() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driverService.getDriverById(driverId).then((d) => {
      setDriver(d ?? null);
      setLoading(false);
    });
  }, [driverId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>;
  if (!driver) return <View style={styles.center}><Text style={{ color: TEXT }}>Driver not found.</Text></View>;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {driver.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
            </Text>
          </View>
          <Text style={styles.name}>{driver.fullName}</Text>
          <Text style={styles.type}>{driver.driverType === 'affiliateDriver' ? 'Affiliate Driver' : 'Independent Driver'}</Text>
          <View style={styles.badges}>
            <StatusBadge label={driver.status.toUpperCase()} color={driverStatusColor(driver.status)} />
            <StatusBadge label={`Docs: ${driver.documentsStatus}`} color={documentStatusColor(driver.documentsStatus)} />
          </View>
          <View style={styles.statsRow}>
            <Stat label="Rating" value={`⭐ ${driver.rating.toFixed(1)}`} />
            <Stat label="Total Jobs" value={String(driver.totalJobs)} />
            <Stat label="Earnings" value={`£${driver.totalEarnings.toLocaleString()}`} />
          </View>
        </View>

        <SectionTitle title="Contact Details" />
        <InfoCard>
          <InfoRow label="Phone" value={driver.phone} />
          <InfoRow label="Email" value={driver.email} />
          <InfoRow label="Address" value={`${driver.address}, ${driver.city}, ${driver.postcode}`} />
        </InfoCard>

        <SectionTitle title="Licence Details" />
        <InfoCard>
          <InfoRow label="Driving Licence" value={driver.drivingLicenceNumber} />
          <InfoRow label="Private Hire Badge" value={driver.privateHireBadgeNumber} />
          <InfoRow label="Date of Birth" value={driver.dateOfBirth} />
          <InfoRow label="Joined" value={driver.joinedDate} />
        </InfoCard>

      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: ROSE_GOLD, fontWeight: '700', fontSize: 16, fontFamily: FONT_MEDIUM ?? undefined }}>{value}</Text>
      <Text style={{ color: MUTED, fontSize: 11, fontFamily: FONT_REGULAR ?? undefined }}>{label}</Text>
    </View>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE, overflow: 'hidden', marginBottom: 16 }}>{children}</View>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: LINE }}>
      <Text style={{ color: MUTED, fontSize: 13, flex: 1, fontFamily: FONT_REGULAR ?? undefined }}>{label}</Text>
      <Text style={{ color: TEXT, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right', fontFamily: FONT_MEDIUM ?? undefined }}>{value}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={{ fontSize: 11, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined }}>{title}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' },
  profileHeader: { alignItems: 'center', paddingVertical: 20, marginBottom: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(215,180,106,0.15)', borderWidth: 2, borderColor: ROSE_GOLD,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: ROSE_GOLD, fontSize: 26, fontWeight: '700', fontFamily: FONT_MEDIUM ?? undefined },
  name: { fontSize: 22, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  type: { fontSize: 13, color: MUTED, marginTop: 3, fontFamily: FONT_REGULAR ?? undefined },
  badges: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 14 },
  statsRow: { flexDirection: 'row', width: '100%', backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: LINE },
});
