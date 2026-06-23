import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { customerApi, storeToken } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen() {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Please use at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const r = await customerApi.post<{ success: boolean; token: string }>('/api/auth/register/customer', {
        fullName: fullName.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password,
      });
      await storeToken(r.token);
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      Alert.alert('Registration failed', (e as Error).message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brand}>Ride Prestige</Text>
          <Text style={styles.tagline}>Premium transport, delivered.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Ride Prestige today</Text>

          {[
            { label: 'Full name *', value: fullName, setter: setFullName, keyboard: 'default' as const, auto: 'name' as const, placeholder: 'Jane Smith' },
            { label: 'Email *', value: email, setter: setEmail, keyboard: 'email-address' as const, auto: 'email' as const, placeholder: 'jane@example.com' },
            { label: 'Phone *', value: phone, setter: setPhone, keyboard: 'phone-pad' as const, auto: 'tel' as const, placeholder: '+44 7700 900000' },
          ].map(f => (
            <View key={f.label} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.setter}
                keyboardType={f.keyboard}
                autoCapitalize={f.keyboard === 'email-address' ? 'none' : 'words'}
                autoComplete={f.auto}
                placeholder={f.placeholder}
                placeholderTextColor="#8b8fa8"
              />
            </View>
          ))}

          <View style={styles.field}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min. 8 characters"
              placeholderTextColor="#8b8fa8"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#0a0f1e" />
              : <Text style={styles.btnText}>Create account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => router.back()}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Sign in</Text></Text>
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
  header:    { alignItems: 'center', marginBottom: 32 },
  brand:     { fontSize: 28, fontWeight: '700', color: GOLD, letterSpacing: 1 },
  tagline:   { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  card:      { backgroundColor: '#fff', borderRadius: 24, padding: 28 },
  title:     { fontSize: 22, fontWeight: '700', color: BLACK, marginBottom: 4 },
  subtitle:  { fontSize: 14, color: '#8b8fa8', marginBottom: 24 },
  field:     { marginBottom: 14 },
  label:     { fontSize: 11, fontWeight: '600', color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  input:     { backgroundColor: '#f8f9fb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: BLACK, borderWidth: 1, borderColor: '#e8eaf0' },
  btn:       { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText:   { fontSize: 15, fontWeight: '700', color: BLACK },
  linkRow:   { marginTop: 18, alignItems: 'center' },
  linkText:  { fontSize: 13, color: '#8b8fa8' },
  link:      { color: GOLD, fontWeight: '600' },
});
