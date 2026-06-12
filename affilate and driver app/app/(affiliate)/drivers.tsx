import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { driverService } from '@/services/driverService';
import { DriverCard } from '@/components/cards/DriverCard';
import type { Driver } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function DriversScreen() {
  const { affiliate } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await driverService.getAffiliateDrivers(affiliate?.id ?? 'aff_001');
    setDrivers(data);
    setLoading(false);
  }, [affiliate?.id]);

  useEffect(() => { load(); }, [load]);

  const available = drivers.filter((d) => d.status === 'available').length;
  const busy = drivers.filter((d) => d.status === 'busy').length;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Drivers</Text>
          <Text style={styles.sub}>{drivers.length} registered · {available} available · {busy} busy</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add-driver')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DriverCard
              driver={item}
              onPress={() => router.push({ pathname: '/driver-details', params: { driverId: item.id } })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyTitle}>No Drivers</Text>
              <Text style={styles.emptyText}>Add your first driver to get started.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: LINE,
  },
  title: { fontSize: 22, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  sub: { fontSize: 13, color: MUTED, marginTop: 2, fontFamily: FONT_REGULAR ?? undefined },
  addBtn: {
    backgroundColor: ROSE_GOLD, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  addBtnText: { color: BLACK, fontWeight: '700', fontSize: 14, fontFamily: FONT_MEDIUM ?? undefined },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: TEXT, marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
  emptyText: { color: MUTED, textAlign: 'center', fontFamily: FONT_REGULAR ?? undefined },
});
