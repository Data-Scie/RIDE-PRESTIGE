import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

type GateState = 'checking' | 'granted' | 'denied';

// This app serves drivers and affiliates, who must share location to be matched and tracked -
// not optional like it might be for a generic app. Blocks all screens (including login) until
// granted, matching the same mandatory policy enforced on the web driver/affiliate portals.
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
          Ride Prestige needs your location to match you with nearby ride requests and let
          dispatch and customers track your journey in progress.
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
