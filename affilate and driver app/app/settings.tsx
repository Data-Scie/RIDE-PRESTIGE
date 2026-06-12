import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Switch, StyleSheet, StatusBar, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function SettingsScreen() {
  const { user } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [earningsAlerts, setEarningsAlerts] = useState(true);
  const [documentAlerts, setDocumentAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.settingsCard}>
          <SettingRow
            label="Push Notifications"
            description="Receive all app notifications"
            value={pushNotifications}
            onToggle={setPushNotifications}
          />
          <SettingRow
            label="New Job Alerts"
            description="Alerts for new job requests"
            value={jobAlerts}
            onToggle={setJobAlerts}
          />
          <SettingRow
            label="Earnings Alerts"
            description="Payment and payout notifications"
            value={earningsAlerts}
            onToggle={setEarningsAlerts}
          />
          <SettingRow
            label="Document Alerts"
            description="Expiry and compliance reminders"
            value={documentAlerts}
            onToggle={setDocumentAlerts}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>SOUND & VIBRATION</Text>
        <View style={styles.settingsCard}>
          <SettingRow
            label="Notification Sound"
            description="Play sound for notifications"
            value={soundEnabled}
            onToggle={setSoundEnabled}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.settingsCard}>
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="Role" value={user?.role ?? '—'} />
          <InfoRow label="Account Status" value="Active" valueColor="#4CAF50" last />
        </View>

        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.settingsCard}>
          <ActionRow
            label="Help & Support"
            icon="❓"
            onPress={() => Alert.alert('Support', 'Contact: support@rideprestige.co.uk')}
          />
          <ActionRow
            label="Terms & Conditions"
            icon="📋"
            onPress={() => Alert.alert('Terms', 'Ride Prestige Terms & Conditions')}
          />
          <ActionRow
            label="Privacy Policy"
            icon="🔒"
            onPress={() => Alert.alert('Privacy', 'Ride Prestige Privacy Policy')}
          />
          <ActionRow
            label="App Version"
            icon="ℹ️"
            onPress={() => {}}
            rightLabel="1.0.0"
            last
          />
        </View>

      </ScrollView>
    </View>
  );
}

function SettingRow({
  label, description, value, onToggle, last = false,
}: { label: string; description: string; value: boolean; onToggle: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[rowStyles.row, !last && rowStyles.rowBorder]}>
      <View style={rowStyles.rowLeft}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#342F24', true: 'rgba(215,180,106,0.5)' }}
        thumbColor={value ? ROSE_GOLD : MUTED}
      />
    </View>
  );
}

function InfoRow({
  label, value, valueColor, last = false,
}: { label: string; value: string; valueColor?: string; last?: boolean }) {
  return (
    <View style={[rowStyles.row, !last && rowStyles.rowBorder]}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function ActionRow({
  label, icon, onPress, rightLabel, last = false,
}: { label: string; icon: string; onPress: () => void; rightLabel?: string; last?: boolean }) {
  return (
    <TouchableOpacity
      style={[rowStyles.row, !last && rowStyles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={rowStyles.icon}>{icon}</Text>
      <Text style={[rowStyles.label, { flex: 1 }]}>{label}</Text>
      {rightLabel ? (
        <Text style={rowStyles.rightLabel}>{rightLabel}</Text>
      ) : (
        <Text style={rowStyles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  rowLeft: { flex: 1 },
  label: { fontSize: 14, color: TEXT, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  desc: { fontSize: 12, color: MUTED, marginTop: 2, fontFamily: FONT_REGULAR ?? undefined },
  value: { fontSize: 14, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  icon: { fontSize: 20 },
  arrow: { color: ROSE_GOLD, fontSize: 20 },
  rightLabel: { fontSize: 13, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 11, color: MUTED, fontWeight: '600', letterSpacing: 1.2,
    marginBottom: 8, marginTop: 16, fontFamily: FONT_MEDIUM ?? undefined,
  },
  settingsCard: {
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE, overflow: 'hidden',
  },
});
