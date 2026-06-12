import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { FormInput } from '@/components/forms/FormInput';
import { driverService } from '@/services/driverService';
import { useAuth } from '@/context/AuthContext';
import { BLACK, ROSE_GOLD, TEXT, MUTED, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

export default function AddDriverScreen() {
  const { affiliate } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', address: '', city: '', postcode: '',
    dateOfBirth: '', drivingLicenceNumber: '', privateHireBadgeNumber: '',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.phone) {
      Alert.alert('Required Fields', 'Please complete all required fields.');
      return;
    }
    setLoading(true);
    try {
      await driverService.addDriver({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postcode: form.postcode,
        dateOfBirth: form.dateOfBirth,
        drivingLicenceNumber: form.drivingLicenceNumber,
        privateHireBadgeNumber: form.privateHireBadgeNumber,
        driverType: 'affiliateDriver',
        affiliateId: affiliate?.id ?? 'aff_001',
        status: 'offline',
        documentsStatus: 'pending',
        isApproved: false,
        joinedDate: new Date().toISOString().split('T')[0],
      });
      Alert.alert('Driver Added', 'The driver has been added successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.note}>The driver will need to complete their profile and submit documents for approval.</Text>

        <FormInput label="Full Name" value={form.fullName} onChangeText={set('fullName')} required placeholder="First and last name" />
        <FormInput label="Email Address" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" required placeholder="driver@email.com" />
        <FormInput label="Phone Number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" required placeholder="+44 7700 000000" />
        <FormInput label="Address" value={form.address} onChangeText={set('address')} placeholder="Street address" />
        <FormInput label="City" value={form.city} onChangeText={set('city')} placeholder="Sheffield" />
        <FormInput label="Postcode" value={form.postcode} onChangeText={set('postcode')} autoCapitalize="characters" placeholder="S1 2GH" />
        <FormInput label="Date of Birth" value={form.dateOfBirth} onChangeText={set('dateOfBirth')} placeholder="DD/MM/YYYY" />
        <FormInput label="Driving Licence Number" value={form.drivingLicenceNumber} onChangeText={set('drivingLicenceNumber')} autoCapitalize="characters" placeholder="SMITH901231SM9AL" />
        <FormInput label="Private Hire Badge / Licence Number" value={form.privateHireBadgeNumber} onChangeText={set('privateHireBadgeNumber')} placeholder="SYP-DRV-XXXX" />

        <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color={BLACK} /> : <Text style={styles.btnSubmitText}>Add Driver</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  note: {
    color: MUTED, fontSize: 13, lineHeight: 20, marginBottom: 20,
    padding: 12, backgroundColor: 'rgba(215,180,106,0.06)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(215,180,106,0.2)', fontFamily: FONT_REGULAR ?? undefined,
  },
  btnSubmit: {
    height: 56, borderRadius: 18, backgroundColor: ROSE_GOLD,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  btnSubmitText: { color: BLACK, fontWeight: '700', fontSize: 16, fontFamily: FONT_MEDIUM ?? undefined },
});
