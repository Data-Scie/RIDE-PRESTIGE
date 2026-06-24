import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, Image, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '@/context/AuthContext';

const LOGO = require('../../assets/images/brand/ride-prestige-logo.png');

const GOOGLE_CONFIGURED = Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (GOOGLE_CONFIGURED) {
      try {
        GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });
      } catch {
        // If the native module isn't ready for any reason, the Google button below
        // will surface a clear "failed" alert when tapped rather than crashing here.
      }
    }
  }, []);

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

  const handleGoogle = async () => {
    if (!GOOGLE_CONFIGURED) {
      Alert.alert('Google sign-in not configured', 'Add the Google OAuth client IDs to the customer app environment before enabling Google sign-in.');
      return;
    }
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response) && response.data.idToken) {
        await loginWithGoogle(response.data.idToken);
        router.replace('/(tabs)');
      }
    } catch (e: unknown) {
      if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
        // User closed the picker - not an error worth surfacing.
      } else {
        Alert.alert('Google sign-in failed', (e as Error).message ?? 'Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BLACK} />

      {/* Full-bleed hero - fills the whole page behind the sheet */}
      <View style={styles.hero}>
        <Image source={LOGO} style={styles.heroLogo} resizeMode="contain" />
        <Text style={styles.tagline}>Premium transport, delivered.</Text>
        <View style={styles.demoPill}>
          <Text style={styles.demoPillText}>Demo service available</Text>
        </View>
      </View>
      <LinearGradient colors={['transparent', 'rgba(10,15,30,0.85)', BLACK]} style={styles.heroShade} pointerEvents="none" />

      <KeyboardAvoidingView style={styles.sheetWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.swipeHint}>Sign in to continue</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
            <View style={styles.field}>
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="Email or phone number"
                placeholderTextColor="#9aa0ae"
              />
            </View>

            <View style={styles.field}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                placeholder="Password"
                placeholderTextColor="#9aa0ae"
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={BLACK} />
                : <Text style={styles.btnText}>Sign in</Text>
              }
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={[styles.googleBtn, googleLoading && styles.btnDisabled]} onPress={handleGoogle} disabled={googleLoading} activeOpacity={0.85}>
              {googleLoading
                ? <ActivityIndicator color={BLACK} />
                : <Text style={styles.googleText}>Continue with Google</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/auth/register' as never)}>
              <Text style={styles.linkText}>Don&apos;t have an account? <Text style={styles.link}>Register</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const GOLD = '#c9a84c';
const BLACK = '#0a0f1e';

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: BLACK },
  hero:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingBottom: 160 },
  heroLogo:    { width: 220, height: 90 },
  tagline:     { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 10, letterSpacing: 0.3 },
  demoPill:    { marginTop: 18, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(201,168,76,0.14)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)' },
  demoPillText: { color: GOLD, fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  heroShade:   { position: 'absolute', left: 0, right: 0, top: 0, height: '60%' },
  sheetWrap:   { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 24, maxHeight: '62%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: -6 }, elevation: 18 },
  handle:      { width: 44, height: 5, borderRadius: 99, backgroundColor: '#e2e4ea', alignSelf: 'center' },
  swipeHint:   { textAlign: 'center', color: '#9aa0ae', fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.6 },
  sheetContent: { paddingBottom: 28 },
  field:       { marginBottom: 14 },
  input:       { backgroundColor: '#f5f6f9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15, color: BLACK, borderWidth: 1, borderColor: '#ebedf2' },
  btn:         { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontSize: 15, fontWeight: '700', color: BLACK },
  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ebedf2' },
  dividerText: { color: '#9aa0ae', fontSize: 12, fontWeight: '600' },
  googleBtn:   { borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#ebedf2', backgroundColor: '#fff' },
  googleText:  { fontSize: 15, fontWeight: '700', color: BLACK },
  linkRow:     { marginTop: 22, alignItems: 'center' },
  linkText:    { fontSize: 13, color: '#8b8fa8' },
  link:        { color: GOLD, fontWeight: '600' },
});
