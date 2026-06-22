import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as Location from 'expo-location';

const BLACK = '#030303';
const ROSE_GOLD = '#D7B46A';
const CARD = '#111211';
const TEXT = '#F8F3EF';
const MUTED = '#B8B0A4';
const FONT_MEDIUM = Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: 'System' });
const FONT_REGULAR = Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'System' });

type GateState = 'checking' | 'granted' | 'denied';

// Customers must share location so we can find their pickup point and match nearby drivers -
// mandatory here like the rest of the platform, not optional. Blocks all screens, including
// login/signup, until granted.
export default function LocationPermissionGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>('checking');

  const check = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setState(status === 'granted' ? 'granted' : 'denied');
  };

  useEffect(() => { check(); }, []);

  const requestAccess = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setState(status === 'granted' ? 'granted' : 'denied');
  };

  if (state === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={ROSE_GOLD} size="large" />
      </View>
    );
  }

  if (state === 'granted') return <>{children}</>;

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Location access required</Text>
        <Text style={styles.text}>
          Ride Prestige needs your location to set your pickup point accurately and match you
          with nearby drivers.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestAccess} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Enable Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  center: { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: CARD, borderRadius: 24, padding: 28, alignItems: 'center', width: '100%' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: TEXT, marginBottom: 12, textAlign: 'center', fontFamily: FONT_MEDIUM ?? undefined },
  text: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 21, marginBottom: 24, fontFamily: FONT_REGULAR ?? undefined },
  button: { backgroundColor: ROSE_GOLD, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  buttonText: { color: BLACK, fontWeight: '700', fontSize: 15, fontFamily: FONT_MEDIUM ?? undefined },
});
