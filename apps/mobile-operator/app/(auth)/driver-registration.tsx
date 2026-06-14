import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FormInput } from '@/components/forms/FormInput';
import { authService, type ApprovedAffiliate } from '@/services/authService';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import type { DriverType } from '@/types';

export default function DriverRegistrationScreen() {
  const { preselect } = useLocalSearchParams<{ preselect?: string }>();
  const [loading, setLoading] = useState(false);
  const [affiliates, setAffiliates] = useState<ApprovedAffiliate[]>([]);
  const [driverType, setDriverType] = useState<DriverType>(
    preselect === 'affiliateDriver' ? 'affiliateDriver' : 'independentDriver',
  );

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', address: '', city: '', postcode: '',
    dateOfBirth: '', drivingLicenceNumber: '', privateHireBadgeNumber: '',
    nationalInsurance: '', affiliateId: '',
    password: '', confirmPassword: '',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    authService.getApprovedAffiliates().then(setAffiliates).catch(() => setAffiliates([]));
  }, []);

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.password) {
      Alert.alert('Required Fields', 'Please fill in all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (driverType === 'affiliateDriver' && !form.affiliateId) {
      Alert.alert('Select Affiliate', 'Please select the affiliate company you work under.');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...registration } = form;
      await authService.registerDriver({ ...registration, driverType });
      router.replace('/(auth)/pending-approval');
    } catch {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const affiliateDocs = ['Driving Licence', 'Private Hire Licence', 'Profile Photo', 'Proof of Address'];
  const independentDocs = [...affiliateDocs, 'Insurance Certificate', 'Vehicle Logbook (V5C)'];
  const docs = driverType === 'affiliateDriver' ? affiliateDocs : independentDocs;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Driver Registration</Text>
        <Text style={styles.sub}>Join the Ride Prestige driver network</Text>

        {/* Driver Type */}
        <SectionTitle title="Driver Type" />
        <TouchableOpacity
          style={[styles.typeCard, driverType === 'affiliateDriver' && styles.typeCardActive]}
          onPress={() => setDriverType('affiliateDriver')}
          activeOpacity={0.75}
        >
          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>🏢</Text>
            <View style={styles.typeInfo}>
              <Text style={[styles.typeTitle, driverType === 'affiliateDriver' && styles.typeTitleActive]}>
                I work under an Affiliate
              </Text>
              <Text style={styles.typeSub}>Jobs assigned by your affiliate company</Text>
            </View>
            <View style={[styles.radio, driverType === 'affiliateDriver' && styles.radioActive]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeCard, driverType === 'independentDriver' && styles.typeCardActive]}
          onPress={() => setDriverType('independentDriver')}
          activeOpacity={0.75}
        >
          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>🚗</Text>
            <View style={styles.typeInfo}>
              <Text style={[styles.typeTitle, driverType === 'independentDriver' && styles.typeTitleActive]}>
                I am an Independent Driver
              </Text>
              <Text style={styles.typeSub}>Direct jobs from Ride Prestige platform</Text>
            </View>
            <View style={[styles.radio, driverType === 'independentDriver' && styles.radioActive]} />
          </View>
        </TouchableOpacity>

        {/* Affiliate Selection */}
        {driverType === 'affiliateDriver' && (
          <>
            <SectionTitle title="Affiliate Details" />
            {affiliates.map((affiliate) => (
              <TouchableOpacity
                key={affiliate.id}
                style={[styles.affiliateOption, form.affiliateId === affiliate.id && styles.typeCardActive]}
                onPress={() => set('affiliateId')(affiliate.id)}
              >
                <View style={styles.typeInfo}>
                  <Text style={[styles.typeTitle, form.affiliateId === affiliate.id && styles.typeTitleActive]}>{affiliate.companyName}</Text>
                  <Text style={styles.typeSub}>{affiliate.city}</Text>
                </View>
                <View style={[styles.radio, form.affiliateId === affiliate.id && styles.radioActive]} />
              </TouchableOpacity>
            ))}
            {!affiliates.length && <Text style={styles.affiliateEmpty}>No approved affiliates are currently available.</Text>}
          </>
        )}

        {/* Personal Details */}
        <SectionTitle title="Personal Details" />
        <FormInput label="Full Name" value={form.fullName} onChangeText={set('fullName')} required placeholder="First and last name" />
        <FormInput label="Email Address" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" required placeholder="you@email.com" />
        <FormInput label="Phone Number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" required placeholder="+44 7700 000000" />
        <FormInput label="Address" value={form.address} onChangeText={set('address')} required placeholder="Street address" />
        <FormInput label="City" value={form.city} onChangeText={set('city')} required placeholder="Sheffield" />
        <FormInput label="Postcode" value={form.postcode} onChangeText={set('postcode')} autoCapitalize="characters" required placeholder="S1 2GH" />
        <FormInput label="Date of Birth" value={form.dateOfBirth} onChangeText={set('dateOfBirth')} placeholder="DD/MM/YYYY" required />

        {/* Licence Details */}
        <SectionTitle title="Licence Details" />
        <FormInput label="Driving Licence Number" value={form.drivingLicenceNumber} onChangeText={set('drivingLicenceNumber')} autoCapitalize="characters" required placeholder="SMITH901231SM9AL" />
        <FormInput label="Private Hire Badge / Licence Number" value={form.privateHireBadgeNumber} onChangeText={set('privateHireBadgeNumber')} required placeholder="SYP-DRV-XXXX" />
        <FormInput label="National Insurance Number (Optional)" value={form.nationalInsurance} onChangeText={set('nationalInsurance')} autoCapitalize="characters" placeholder="NW123456C" />

        {/* Documents */}
        <SectionTitle title="Documents to Upload" />
        {docs.map((doc) => (
          <TouchableOpacity key={doc} style={styles.docUploadRow} activeOpacity={0.7}>
            <Text style={styles.docUploadIcon}>📄</Text>
            <View style={styles.docUploadInfo}>
              <Text style={styles.docUploadTitle}>{doc}</Text>
              <Text style={styles.docUploadSub}>Tap to upload</Text>
            </View>
            <Text style={styles.docUploadArrow}>+</Text>
          </TouchableOpacity>
        ))}

        {/* Password */}
        <SectionTitle title="Create Account" />
        <FormInput label="Password" value={form.password} onChangeText={set('password')} secureTextEntry required placeholder="Minimum 8 characters" />
        <FormInput label="Confirm Password" value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry required placeholder="Re-enter password" />

        <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color={BLACK} />
          ) : (
            <Text style={styles.btnSubmitText}>Submit Registration</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Your application will be reviewed. You will be contacted once your account is approved.
        </Text>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.text}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: { marginTop: 20, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 8 },
  text: { fontSize: 13, color: ROSE_GOLD, fontWeight: '700', letterSpacing: 0.8, fontFamily: FONT_MEDIUM ?? undefined },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  backText: { color: ROSE_GOLD, fontSize: 16, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  title: { fontSize: 26, fontWeight: '700', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  sub: { color: MUTED, fontSize: 13, marginTop: 6, marginBottom: 4, fontFamily: FONT_REGULAR ?? undefined },
  typeCard: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE, padding: 14, marginBottom: 10 },
  typeCardActive: { borderColor: ROSE_GOLD, backgroundColor: 'rgba(215,180,106,0.06)' },
  affiliateOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: LINE, padding: 14, marginBottom: 8 },
  affiliateEmpty: { color: MUTED, fontSize: 13, paddingVertical: 8, fontFamily: FONT_REGULAR ?? undefined },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIcon: { fontSize: 28 },
  typeInfo: { flex: 1 },
  typeTitle: { fontSize: 15, fontWeight: '600', color: MUTED, fontFamily: FONT_MEDIUM ?? undefined },
  typeTitleActive: { color: TEXT },
  typeSub: { fontSize: 12, color: MUTED, marginTop: 2, fontFamily: FONT_REGULAR ?? undefined },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: LINE },
  radioActive: { borderColor: ROSE_GOLD, backgroundColor: ROSE_GOLD },
  docUploadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: LINE,
    padding: 14, marginBottom: 8,
  },
  docUploadIcon: { fontSize: 24 },
  docUploadInfo: { flex: 1 },
  docUploadTitle: { fontSize: 14, color: TEXT, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  docUploadSub: { fontSize: 12, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  docUploadArrow: { color: ROSE_GOLD, fontSize: 22, fontWeight: '700' },
  btnSubmit: {
    height: 56, borderRadius: 18, backgroundColor: ROSE_GOLD,
    alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 16,
  },
  btnSubmitText: { color: BLACK, fontWeight: '700', fontSize: 16, fontFamily: FONT_MEDIUM ?? undefined },
  disclaimer: { color: MUTED, fontSize: 12, textAlign: 'center', lineHeight: 18, fontFamily: FONT_REGULAR ?? undefined },
});
