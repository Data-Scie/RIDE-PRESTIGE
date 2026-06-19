import { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { FormInput } from '@/components/forms/FormInput';
import type { UserRole } from '@/types';
import {
  BLACK, BLACK_2, ROSE_GOLD, ROSE_GOLD_2, TEXT, MUTED, CARD, CARD_2, LINE, FONT_MEDIUM, FONT_REGULAR,
} from '@/constants/theme';

const ROLES: { label: string; value: UserRole }[] = [
  { label: 'Affiliate', value: 'affiliate' },
  { label: 'Affiliate Driver', value: 'affiliateDriver' },
  { label: 'Independent Driver', value: 'independentDriver' },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('affiliate');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password, role);
    } catch {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.headerArea}>
          <Image source={require('../../assets/images/brand/ride-prestige-logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.sub}>Ride Prestige Affiliate & Driver Portal</Text>
        </View>

        {/* Role Selector */}
        <Text style={styles.fieldLabel}>I am a</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}
              onPress={() => setRole(r.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.roleBtnText, role === r.value && styles.roleBtnTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Credentials */}
        <FormInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
          required
        />
        <FormInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          required
        />

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotLink}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnLogin} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color={BLACK} />
          ) : (
            <Text style={styles.btnLoginText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register-choice')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 60 },
  back: { marginBottom: 24 },
  backText: { color: ROSE_GOLD, fontSize: 16, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  headerArea: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 160, height: 88, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  sub: { color: MUTED, fontSize: 13, marginTop: 4, fontFamily: FONT_REGULAR ?? undefined },
  fieldLabel: { fontSize: 11, color: MUTED, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  roleBtn: { flex: 1, minWidth: 100, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, alignItems: 'center' },
  roleBtnActive: { backgroundColor: 'rgba(215,180,106,0.12)', borderColor: ROSE_GOLD },
  roleBtnText: { fontSize: 13, color: MUTED, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined, textAlign: 'center' },
  roleBtnTextActive: { color: ROSE_GOLD },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -6 },
  forgotText: { color: ROSE_GOLD, fontSize: 13, fontFamily: FONT_MEDIUM ?? undefined },
  btnLogin: {
    height: 56, borderRadius: 18, backgroundColor: ROSE_GOLD,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  btnLoginText: { color: BLACK, fontWeight: '700', fontSize: 16, fontFamily: FONT_MEDIUM ?? undefined },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { color: MUTED, fontSize: 14, fontFamily: FONT_REGULAR ?? undefined },
  registerLink: { color: ROSE_GOLD, fontSize: 14, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
});
