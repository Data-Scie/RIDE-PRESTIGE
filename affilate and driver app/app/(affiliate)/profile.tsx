import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function AffiliateProfileScreen() {
  const { user, affiliate, logout } = useAuth();

  const fields = [
    { label: 'Company Name', value: affiliate?.companyName },
    { label: 'Trading Name', value: affiliate?.tradingName },
    { label: 'Contact Person', value: affiliate?.contactPerson },
    { label: 'Email', value: affiliate?.email },
    { label: 'Phone', value: affiliate?.phone },
    { label: 'Address', value: `${affiliate?.address}, ${affiliate?.city}, ${affiliate?.postcode}` },
    { label: 'Operator Licence', value: affiliate?.operatorLicenceNumber },
    { label: 'Company Reg No.', value: affiliate?.companyRegNumber },
    { label: 'VAT Number', value: affiliate?.vatNumber ?? 'Not provided' },
    { label: 'Service Areas', value: affiliate?.serviceAreas.join(', ') },
    { label: 'Rating', value: `⭐ ${affiliate?.rating.toFixed(1)}` },
    { label: 'Total Jobs', value: String(affiliate?.totalJobs) },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Header banner */}
      <View style={styles.banner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.avatarInitials ?? 'AF'}</Text>
        </View>
        <View>
          <Text style={styles.name}>{affiliate?.companyName}</Text>
          <Text style={styles.role}>Affiliate Operator</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Company Profile" />
        {fields.map((f) => (
          <View key={f.label} style={styles.row}>
            <Text style={styles.rowLabel}>{f.label}</Text>
            <Text style={styles.rowValue}>{f.value}</Text>
          </View>
        ))}

        <SectionTitle title="Bank Details" />
        <View style={styles.bankNote}>
          <Text style={styles.bankNoteText}>
            🔒 Bank details are managed securely. Contact Ride Prestige to update payment information.
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Account Holder</Text>
          <Text style={styles.rowValue}>{affiliate?.bankAccountName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Sort Code</Text>
          <Text style={styles.rowValue}>{affiliate?.sortCode}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Account Number</Text>
          <Text style={styles.rowValue}>••••{affiliate?.accountNumber.slice(-4)}</Text>
        </View>

        <SectionTitle title="Account Actions" />
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.75}
        >
          <Text style={styles.actionIcon}>🔔</Text>
          <Text style={styles.actionLabel}>Notifications</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push('/settings')}
          activeOpacity={0.75}
        >
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
  return (
    <Text style={sectionStyles.text}>{title}</Text>
  );
}
const sectionStyles = StyleSheet.create({
  text: { fontSize: 11, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 1.1, marginTop: 20, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: LINE,
    backgroundColor: 'rgba(215,180,106,0.04)',
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(215,180,106,0.15)', borderWidth: 2, borderColor: ROSE_GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: ROSE_GOLD, fontSize: 20, fontWeight: '700', fontFamily: FONT_MEDIUM ?? undefined },
  name: { fontSize: 18, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  role: { fontSize: 13, color: ROSE_GOLD, marginTop: 2, fontFamily: FONT_REGULAR ?? undefined },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 12,
  },
  rowLabel: { fontSize: 13, color: MUTED, flex: 1, fontFamily: FONT_REGULAR ?? undefined },
  rowValue: { fontSize: 13, color: TEXT, fontWeight: '600', flex: 1, textAlign: 'right', fontFamily: FONT_MEDIUM ?? undefined },
  bankNote: {
    backgroundColor: 'rgba(215,180,106,0.06)', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(215,180,106,0.2)', padding: 12, marginBottom: 4,
  },
  bankNoteText: { color: MUTED, fontSize: 12, lineHeight: 18, fontFamily: FONT_REGULAR ?? undefined },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: LINE,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { flex: 1, fontSize: 15, color: TEXT, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  actionArrow: { color: ROSE_GOLD, fontSize: 20 },
  logoutRow: { borderColor: 'rgba(229,57,53,0.3)', backgroundColor: 'rgba(229,57,53,0.06)' },
  logoutLabel: { flex: 1, fontSize: 15, color: '#E53935', fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
});
