import { View, Text, Image, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { BLACK, ROSE_GOLD, ROSE_GOLD_2, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function RegisterChoiceScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Image source={require('../../assets/images/brand/ride-prestige-logo.png')} style={styles.brand} resizeMode="contain" />
        <Text style={styles.title}>Join Our Network</Text>
        <Text style={styles.sub}>Choose how you&apos;d like to register</Text>
      </View>

      {/* Affiliate Option */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => router.push('/(auth)/affiliate-registration')}
        activeOpacity={0.8}
      >
        <View style={styles.optionIconWrap}>
          <Text style={styles.optionIcon}>🏢</Text>
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionTitle}>Register as Affiliate</Text>
          <Text style={styles.optionDesc}>
            Operate a fleet of vehicles and drivers.{'\n'}
            Receive and manage ride jobs from Ride Prestige.
          </Text>
          <View style={styles.features}>
            {['Manage drivers & vehicles', 'Accept & allocate jobs', 'Track fleet earnings'].map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureDot}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* Driver Option */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => router.push('/(auth)/driver-registration')}
        activeOpacity={0.8}
      >
        <View style={styles.optionIconWrap}>
          <Text style={styles.optionIcon}>🚗</Text>
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionTitle}>Register as Driver</Text>
          <Text style={styles.optionDesc}>
            Work under an affiliate or independently{'\n'}
            with Ride Prestige direct jobs.
          </Text>
          <View style={styles.features}>
            {['Affiliate or independent', 'Accept ride assignments', 'Track your earnings'].map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureDot}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 32 },
  back: { marginBottom: 24 },
  backText: { color: ROSE_GOLD, fontSize: 16, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  header: { marginBottom: 28 },
  brand: { width: 105, height: 54, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  sub: { color: MUTED, fontSize: 14, marginTop: 4, fontFamily: FONT_REGULAR ?? undefined },
  optionCard: {
    backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: LINE,
    padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 14,
  },
  optionIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(215,180,106,0.1)', borderWidth: 1, borderColor: 'rgba(215,180,106,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionIcon: { fontSize: 26 },
  optionInfo: { flex: 1, gap: 4 },
  optionTitle: { fontSize: 17, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  optionDesc: { fontSize: 13, color: MUTED, lineHeight: 19, fontFamily: FONT_REGULAR ?? undefined },
  features: { marginTop: 8, gap: 3 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureDot: { color: ROSE_GOLD, fontWeight: '700', fontSize: 13 },
  featureText: { color: MUTED, fontSize: 12, fontFamily: FONT_REGULAR ?? undefined },
  arrow: { color: ROSE_GOLD, fontSize: 24, alignSelf: 'center', fontFamily: FONT_MEDIUM ?? undefined },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  loginText: { color: MUTED, fontSize: 14, fontFamily: FONT_REGULAR ?? undefined },
  loginLink: { color: ROSE_GOLD, fontWeight: '600', fontSize: 14, fontFamily: FONT_MEDIUM ?? undefined },
});
