import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const GOOGLE_CONFIGURED = Boolean(
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
);

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) return;
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      Alert.alert('Login failed', (e as Error).message ?? 'Invalid email/phone or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    if (!GOOGLE_CONFIGURED) {
      Alert.alert('Google sign-in not configured', 'Add the Google OAuth client IDs to the customer app environment before enabling Google sign-in.');
      return;
    }
    Alert.alert('Google sign-in', 'Google sign-in credentials are present, but the native OAuth exchange still needs to be connected before release.');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>Ride Prestige</Text>
          <Text style={styles.tagline}>Premium transport, delivered.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email or phone</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com or +44 7700 900000"
              placeholderTextColor="#8b8fa8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="Password"
              placeholderTextColor="#8b8fa8"
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} activeOpacity={0.8}>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#0a0f1e" />
              : <Text style={styles.btnText}>Sign in</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/auth/register' as never)}>
            <Text style={styles.linkText}>Don&apos;t have an account? <Text style={styles.link}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const GOLD = '#c9a84c';
const BLACK = '#0a0f1e';

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: BLACK },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header:    { alignItems: 'center', marginBottom: 40 },
  brand:     { fontSize: 32, fontWeight: '700', color: GOLD, letterSpacing: 1 },
  tagline:   { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  card:      { backgroundColor: '#fff', borderRadius: 24, padding: 28 },
  title:     { fontSize: 22, fontWeight: '700', color: BLACK, marginBottom: 4 },
  subtitle:  { fontSize: 14, color: '#8b8fa8', marginBottom: 24 },
  field:     { marginBottom: 16 },
  label:     { fontSize: 12, fontWeight: '600', color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:     { backgroundColor: '#f8f9fb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: BLACK, borderWidth: 1, borderColor: '#e8eaf0' },
  googleBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4, marginBottom: 10, borderWidth: 1, borderColor: '#e8eaf0', backgroundColor: '#fff' },
  googleText: { fontSize: 15, fontWeight: '700', color: BLACK },
  btn:       { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText:   { fontSize: 15, fontWeight: '700', color: BLACK },
  linkRow:   { marginTop: 20, alignItems: 'center' },
  linkText:  { fontSize: 13, color: '#8b8fa8' },
  link:      { color: GOLD, fontWeight: '600' },
});
