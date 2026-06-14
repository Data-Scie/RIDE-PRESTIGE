import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { FormInput } from '@/components/forms/FormInput';
import { authService } from '@/services/authService';
import { BLACK, ROSE_GOLD, TEXT, MUTED, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{sent ? '📧' : '🔑'}</Text>
      </View>

      {sent ? (
        <>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.sub}>
            We&apos;ve sent password reset instructions to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
            <Text style={styles.btnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.sub}>
            Enter your registered email address and we&apos;ll send you a link to reset your password.
          </Text>
          <FormInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            required
          />
          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={BLACK} />
            ) : (
              <Text style={styles.btnText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 32 },
  backText: { color: ROSE_GOLD, fontSize: 16, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(215,180,106,0.1)', borderWidth: 1, borderColor: 'rgba(215,180,106,0.35)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24, alignSelf: 'center',
  },
  icon: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: '700', color: TEXT, textAlign: 'center', marginBottom: 12, fontFamily: FONT_MEDIUM ?? undefined },
  sub: { color: MUTED, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28, fontFamily: FONT_REGULAR ?? undefined },
  emailHighlight: { color: ROSE_GOLD, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  btn: {
    height: 56, borderRadius: 18, backgroundColor: ROSE_GOLD,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnText: { color: BLACK, fontWeight: '700', fontSize: 16, fontFamily: FONT_MEDIUM ?? undefined },
});
