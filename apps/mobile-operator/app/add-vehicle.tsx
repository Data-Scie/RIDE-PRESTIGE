import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { FormInput } from '@/components/forms/FormInput';
import { vehicleService } from '@/services/vehicleService';
import { useAuth } from '@/context/AuthContext';
import type { VehicleType } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

const VEHICLE_TYPES: VehicleType[] = ['Saloon', 'Estate', 'MPV', 'Executive', 'Minibus', 'Coach', 'Luxury'];

export default function AddVehicleScreen() {
  const { affiliate } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>('Executive');
  const [form, setForm] = useState({
    make: '', model: '', year: '', registration: '', colour: '',
    passengerCapacity: '', luggageCapacity: '',
    motExpiry: '', insuranceExpiry: '', phvLicenceExpiry: '',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.make || !form.model || !form.registration) {
      Alert.alert('Required Fields', 'Please complete all required fields.');
      return;
    }
    setLoading(true);
    try {
      await vehicleService.addVehicle({
        make: form.make,
        model: form.model,
        year: parseInt(form.year, 10) || new Date().getFullYear(),
        registration: form.registration.toUpperCase(),
        vehicleType,
        colour: form.colour,
        passengerCapacity: parseInt(form.passengerCapacity, 10) || 4,
        luggageCapacity: parseInt(form.luggageCapacity, 10) || 3,
        motExpiry: form.motExpiry,
        insuranceExpiry: form.insuranceExpiry,
        phvLicenceExpiry: form.phvLicenceExpiry,
        status: 'available',
        affiliateId: affiliate?.id ?? 'aff_001',
      });
      Alert.alert('Vehicle Added', 'The vehicle has been added to your fleet.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Text style={styles.fieldLabel}>Vehicle Type</Text>
        <View style={styles.typeGrid}>
          {VEHICLE_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, vehicleType === t && styles.typeChipActive]}
              onPress={() => setVehicleType(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.typeChipText, vehicleType === t && styles.typeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FormInput label="Make" value={form.make} onChangeText={set('make')} required placeholder="Mercedes-Benz" />
        <FormInput label="Model" value={form.model} onChangeText={set('model')} required placeholder="E-Class" />
        <FormInput label="Year" value={form.year} onChangeText={set('year')} keyboardType="number-pad" required placeholder="2022" />
        <FormInput label="Registration Number" value={form.registration} onChangeText={set('registration')} autoCapitalize="characters" required placeholder="AB22 XYZ" />
        <FormInput label="Colour" value={form.colour} onChangeText={set('colour')} placeholder="Obsidian Black" />
        <FormInput label="Passenger Capacity" value={form.passengerCapacity} onChangeText={set('passengerCapacity')} keyboardType="number-pad" required placeholder="4" />
        <FormInput label="Luggage Capacity" value={form.luggageCapacity} onChangeText={set('luggageCapacity')} keyboardType="number-pad" required placeholder="3" />
        <FormInput label="MOT Expiry (YYYY-MM-DD)" value={form.motExpiry} onChangeText={set('motExpiry')} placeholder="2026-01-01" />
        <FormInput label="Insurance Expiry (YYYY-MM-DD)" value={form.insuranceExpiry} onChangeText={set('insuranceExpiry')} placeholder="2025-12-31" />
        <FormInput label="PHV Licence Expiry (YYYY-MM-DD)" value={form.phvLicenceExpiry} onChangeText={set('phvLicenceExpiry')} placeholder="2025-06-30" />

        <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color={BLACK} /> : <Text style={styles.btnSubmitText}>Add Vehicle</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  fieldLabel: { fontSize: 11, color: MUTED, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: LINE },
  typeChipActive: { backgroundColor: 'rgba(215,180,106,0.12)', borderColor: ROSE_GOLD },
  typeChipText: { color: MUTED, fontSize: 13, fontFamily: FONT_MEDIUM ?? undefined },
  typeChipTextActive: { color: ROSE_GOLD },
  btnSubmit: {
    height: 56, borderRadius: 18, backgroundColor: ROSE_GOLD,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  btnSubmitText: { color: BLACK, fontWeight: '700', fontSize: 16, fontFamily: FONT_MEDIUM ?? undefined },
});
