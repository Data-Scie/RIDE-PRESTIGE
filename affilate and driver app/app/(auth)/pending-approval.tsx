import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { BLACK, ROSE_GOLD, ROSE_GOLD_2, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function PendingApprovalScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />

      <View style={styles.iconWrap}>
        <Text style={styles.icon}>⏳</Text>
      </View>

      <Text style={styles.title}>Application Submitted</Text>

      <View style={styles.card}>
        <Text style={styles.message}>
          Your affiliate registration has been submitted.{'\n\n'}
          Ride Prestige admin will review and approve your account.{'\n\n'}
          You will receive a notification once your account is activated.
        </Text>
      </View>

      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>What happens next?</Text>
        {[
          { step: '1', label: 'Application received', done: true },
          { step: '2', label: 'Admin reviews your documents', done: false },
          { step: '3', label: 'Identity & licence verification', done: false },
          { step: '4', label: 'Account activation', done: false },
        ].map((s) => (
          <View key={s.step} style={styles.stepRow}>
            <View style={[styles.stepCircle, s.done && styles.stepCircleDone]}>
              <Text style={[styles.stepNum, s.done && styles.stepNumDone]}>{s.done ? '✓' : s.step}</Text>
            </View>
            <Text style={[styles.stepLabel, s.done && styles.stepLabelDone]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.contact}>
        Questions? Contact us at{'\n'}
        <Text style={styles.contactEmail}>support@rideprestige.co.uk</Text>
      </Text>

      <TouchableOpacity style={styles.btnBack} onPress={() => router.replace('/(auth)/welcome')} activeOpacity={0.8}>
        <Text style={styles.btnBackText}>Back to Welcome</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  iconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(215,180,106,0.1)', borderWidth: 2, borderColor: ROSE_GOLD,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 26, fontWeight: '700', color: TEXT, textAlign: 'center', marginBottom: 20, fontFamily: FONT_MEDIUM ?? undefined },
  card: {
    backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: LINE,
    padding: 20, width: '100%', marginBottom: 16,
  },
  message: { color: MUTED, fontSize: 15, lineHeight: 24, textAlign: 'center', fontFamily: FONT_REGULAR ?? undefined },
  stepsCard: {
    backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: LINE,
    padding: 20, width: '100%', marginBottom: 20,
  },
  stepsTitle: { color: ROSE_GOLD, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 14, fontFamily: FONT_MEDIUM ?? undefined },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(215,180,106,0.08)', borderWidth: 1, borderColor: LINE,
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleDone: { backgroundColor: 'rgba(215,180,106,0.2)', borderColor: ROSE_GOLD },
  stepNum: { color: MUTED, fontSize: 12, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  stepNumDone: { color: ROSE_GOLD },
  stepLabel: { color: MUTED, fontSize: 14, fontFamily: FONT_REGULAR ?? undefined },
  stepLabelDone: { color: TEXT },
  contact: { textAlign: 'center', color: MUTED, fontSize: 13, lineHeight: 20, marginBottom: 24, fontFamily: FONT_REGULAR ?? undefined },
  contactEmail: { color: ROSE_GOLD, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  btnBack: {
    width: '100%', height: 52, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(215,180,106,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  btnBackText: { color: ROSE_GOLD, fontWeight: '600', fontSize: 15, fontFamily: FONT_MEDIUM ?? undefined },
});
