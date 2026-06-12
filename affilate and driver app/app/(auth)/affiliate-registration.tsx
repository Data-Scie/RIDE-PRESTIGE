import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { FormInput } from '@/components/forms/FormInput';
import { authService } from '@/services/authService';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';

const SERVICE_AREA_OPTIONS = ['Sheffield', 'Rotherham', 'Doncaster', 'Manchester', 'Leeds', 'Birmingham', 'London', 'Liverpool', 'Nottingham', 'Heathrow', 'Manchester Airport'];

export default function AffiliateRegistrationScreen() {
  const [loading, setLoading] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const [form, setForm] = useState({
    companyName: '', tradingName: '', contactPerson: '', email: '', phone: '',
    address: '', city: '', postcode: '', operatorLicence: '', companyRegNumber: '',
    vatNumber: '', numberOfVehicles: '', numberOfDrivers: '',
    bankAccountName: '', sortCode: '', accountNumber: '',
    password: '', confirmPassword: '',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const handleSubmit = async () => {
    if (!form.companyName || !form.email || !form.password) {
      Alert.alert('Required Fields', 'Please fill in all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authService.registerAffiliate({ ...form, serviceAreas: selectedAreas.join(',') });
      router.replace('/(auth)/pending-approval');
    } catch {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Affiliate Registration</Text>
        <Text style={styles.sub}>Complete all sections to join the Ride Prestige network</Text>

        {/* Company Details */}
        <SectionTitle title="Company Details" />
        <FormInput label="Company Name" value={form.companyName} onChangeText={set('companyName')} required placeholder="Premier Transfers Ltd" />
        <FormInput label="Trading Name" value={form.tradingName} onChangeText={set('tradingName')} placeholder="Premier Transfers" />
        <FormInput label="Contact Person Name" value={form.contactPerson} onChangeText={set('contactPerson')} required placeholder="Full name" />
        <FormInput label="Email Address" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" required placeholder="ops@company.co.uk" />
        <FormInput label="Phone Number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" required placeholder="+44 7700 000000" />
        <FormInput label="Company Address" value={form.address} onChangeText={set('address')} required placeholder="18 Innovation Way" />
        <FormInput label="City" value={form.city} onChangeText={set('city')} required placeholder="Sheffield" />
        <FormInput label="Postcode" value={form.postcode} onChangeText={set('postcode')} autoCapitalize="characters" required placeholder="S1 2GH" />

        {/* Licensing */}
        <SectionTitle title="Licensing & Registration" />
        <FormInput label="Operator Licence Number" value={form.operatorLicence} onChangeText={set('operatorLicence')} required placeholder="OC/123456/789" />
        <FormInput label="Company Registration Number" value={form.companyRegNumber} onChangeText={set('companyRegNumber')} required placeholder="09876543" />
        <FormInput label="VAT Number (Optional)" value={form.vatNumber} onChangeText={set('vatNumber')} placeholder="GB123456789" />

        {/* Fleet */}
        <SectionTitle title="Fleet Details" />
        <FormInput label="Number of Vehicles" value={form.numberOfVehicles} onChangeText={set('numberOfVehicles')} keyboardType="number-pad" required placeholder="5" />
        <FormInput label="Number of Drivers" value={form.numberOfDrivers} onChangeText={set('numberOfDrivers')} keyboardType="number-pad" required placeholder="4" />

        {/* Service Areas */}
        <SectionTitle title="Service Areas" />
        <Text style={styles.areaHint}>Select all areas you operate in</Text>
        <View style={styles.areaGrid}>
          {SERVICE_AREA_OPTIONS.map((area) => (
            <TouchableOpacity
              key={area}
              style={[styles.areaChip, selectedAreas.includes(area) && styles.areaChipActive]}
              onPress={() => toggleArea(area)}
              activeOpacity={0.7}
            >
              <Text style={[styles.areaChipText, selectedAreas.includes(area) && styles.areaChipTextActive]}>
                {area}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bank Details */}
        <SectionTitle title="Bank Details" />
        <FormInput label="Account Holder Name" value={form.bankAccountName} onChangeText={set('bankAccountName')} required placeholder="Premier Transfers Ltd" />
        <FormInput label="Sort Code" value={form.sortCode} onChangeText={set('sortCode')} keyboardType="number-pad" required placeholder="20-45-67" />
        <FormInput label="Account Number" value={form.accountNumber} onChangeText={set('accountNumber')} keyboardType="number-pad" required placeholder="12345678" />

        {/* Documents */}
        <SectionTitle title="Documents to Upload" />
        {['Operator Licence', 'Insurance Document', 'Company Certificate', 'Proof of Address'].map((doc) => (
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
          Your application will be reviewed by the Ride Prestige team. You will be notified once approved.
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
  areaHint: { color: MUTED, fontSize: 12, marginBottom: 10, fontFamily: FONT_REGULAR ?? undefined },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  areaChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: LINE },
  areaChipActive: { backgroundColor: 'rgba(215,180,106,0.12)', borderColor: ROSE_GOLD },
  areaChipText: { color: MUTED, fontSize: 13, fontFamily: FONT_MEDIUM ?? undefined },
  areaChipTextActive: { color: ROSE_GOLD },
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
