import { View, Text, Image, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BLACK, ROSE_GOLD, ROSE_GOLD_2, TEXT, MUTED, FONT_MEDIUM, FONT_REGULAR, LINE } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />

      {/* Logo / Branding */}
      <View style={styles.heroArea}>
        <LinearGradient
          colors={['rgba(215,180,106,0.08)', 'transparent']}
          style={styles.heroGradient}
        />
        <Image source={require('../../assets/images/brand/ride-prestige-logo.png')} style={styles.brandLogo} resizeMode="contain" />
        <Text style={styles.tagline}>Affiliate & Driver Portal</Text>
        <Text style={styles.sub}>
          Professional fleet management and{'\n'}ride operations platform
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
          <Text style={styles.btnPrimaryText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Register as</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.registerRow}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push('/(auth)/register-choice')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryIcon}>🏢</Text>
            <Text style={styles.btnSecondaryText}>Affiliate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push({ pathname: '/(auth)/driver-registration', params: { preselect: '' } })}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryIcon}>🚗</Text>
            <Text style={styles.btnSecondaryText}>Driver</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          © 2024 Ride Prestige · All rights reserved
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  heroGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '80%',
  },
  brandLogo: { width: 218, height: 143, marginBottom: 4 },
  tagline: {
    fontSize: 14,
    color: ROSE_GOLD_2,
    letterSpacing: 1.5,
    marginTop: 4,
    fontFamily: FONT_MEDIUM ?? undefined,
  },
  sub: {
    marginTop: 16,
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONT_REGULAR ?? undefined,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  btnPrimary: {
    height: 56,
    borderRadius: 18,
    backgroundColor: ROSE_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: BLACK,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_MEDIUM ?? undefined,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: LINE },
  dividerText: { color: MUTED, fontSize: 12, fontFamily: FONT_REGULAR ?? undefined },
  registerRow: { flexDirection: 'row', gap: 12 },
  btnSecondary: {
    flex: 1, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(215,180,106,0.08)',
    borderWidth: 1, borderColor: 'rgba(215,180,106,0.35)',
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  btnSecondaryIcon: { fontSize: 20 },
  btnSecondaryText: {
    color: ROSE_GOLD,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONT_MEDIUM ?? undefined,
  },
  footer: { textAlign: 'center', color: MUTED, fontSize: 11, marginTop: 8, fontFamily: FONT_REGULAR ?? undefined },
});
