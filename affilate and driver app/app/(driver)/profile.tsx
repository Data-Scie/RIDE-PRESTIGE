import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { driverStatusColor } from '@/utils/helpers';

export default function DriverProfileScreen() {
  const { user, driver, logout } = useAuth();

  const fields = [
    { label: 'Full Name', value: driver?.fullName },
    { label: 'Email', value: driver?.email },
    { label: 'Phone', value: driver?.phone },
    { label: 'Address', value: `${driver?.address}, ${driver?.city}, ${driver?.postcode}` },
    { label: 'Date of Birth', value: driver?.dateOfBirth },
    { label: 'Driver Type', value: driver?.driverType === 'affiliateDriver' ? 'Affiliate Driver' : 'Independent Driver' },
    { label: 'Total Jobs', value: String(driver?.totalJobs ?? 0) },
    { label: 'Rating', value: `⭐ ${driver?.rating.toFixed(1) ?? '—'}` },
    { label: 'Joined', value: driver?.joinedDate },
  ];

  const licenceFields = [
    { label: 'Driving Licence No.', value: driver?.drivingLicenceNumber },
    { label: 'Private Hire Badge', value: driver?.privateHireBadgeNumber },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.banner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.avatarInitials ?? 'DR'}</Text>
        </View>
        <View>
          <Text style={styles.name}>{driver?.fullName ?? user?.name}</Text>
          <Text style={styles.type}>
            {user?.role === 'affiliateDriver' ? 'Affiliate Driver' : 'Independent Driver'}
          </Text>
          {driver && (
            <StatusBadge
              label={driver.status.toUpperCase()}
              color={driverStatusColor(driver.status)}
            />
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Personal Details" />
        {fields.map((f) => (
          <View key={f.label} style={styles.row}>
            <Text style={styles.rowLabel}>{f.label}</Text>
            <Text style={styles.rowValue}>{f.value ?? '—'}</Text>
          </View>
        ))}

        <SectionTitle title="Licence Details" />
        {licenceFields.map((f) => (
          <View key={f.label} style={styles.row}>
            <Text style={styles.rowLabel}>{f.label}</Text>
            <Text style={styles.rowValue}>{f.value ?? '—'}</Text>
          </View>
        ))}

        <SectionTitle title="Account Actions" />
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/documents')} activeOpacity={0.75}>
          <Text style={styles.actionIcon}>📄</Text>
          <Text style={styles.actionLabel}>My Documents</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/ride-history')} activeOpacity={0.75}>
          <Text style={styles.actionIcon}>🕐</Text>
          <Text style={styles.actionLabel}>Ride History</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/notifications')} activeOpacity={0.75}>
          <Text style={styles.actionIcon}>🔔</Text>
          <Text style={styles.actionLabel}>Notifications</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/settings')} activeOpacity={0.75}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionLabel}>Settings</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionRow, styles.logoutRow]}
          onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
          ])}
          activeOpacity={0.75}
        >
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={styles.logoutLabel}>Sign Out</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={{ fontSize: 11, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 1.1, marginTop: 20, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined }}>{title}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: LINE, backgroundColor: 'rgba(215,180,106,0.04)',
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(215,180,106,0.15)', borderWidth: 2, borderColor: ROSE_GOLD, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: ROSE_GOLD, fontSize: 20, fontWeight: '700', fontFamily: FONT_MEDIUM ?? undefined },
  name: { fontSize: 18, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  type: { fontSize: 13, color: MUTED, marginTop: 2, marginBottom: 4, fontFamily: FONT_REGULAR ?? undefined },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 12 },
  rowLabel: { fontSize: 13, color: MUTED, flex: 1, fontFamily: FONT_REGULAR ?? undefined },
  rowValue: { fontSize: 13, color: TEXT, fontWeight: '600', flex: 1, textAlign: 'right', fontFamily: FONT_MEDIUM ?? undefined },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: LINE, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  actionIcon: { fontSize: 20 },
  actionLabel: { flex: 1, fontSize: 15, color: TEXT, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  actionArrow: { color: ROSE_GOLD, fontSize: 20 },
  logoutRow: { borderColor: 'rgba(229,57,53,0.3)', backgroundColor: 'rgba(229,57,53,0.06)' },
  logoutLabel: { flex: 1, fontSize: 15, color: '#E53935', fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
});
