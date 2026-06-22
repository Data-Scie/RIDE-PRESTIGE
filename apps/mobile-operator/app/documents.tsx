import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/context/AuthContext';
import { documentService } from '@/services/documentService';
import type { Document } from '@/types';
import { BLACK, ROSE_GOLD, TEXT, MUTED, CARD, LINE, FONT_MEDIUM, FONT_REGULAR } from '@/constants/theme';
import { documentStatusColor, formatDate } from '@/utils/helpers';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function DocumentsScreen() {
  const { user, driver } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [expiryInput, setExpiryInput] = useState('');
  const role = user?.role ?? driver?.driverType ?? 'affiliateDriver';

  const load = useCallback(async () => {
    setLoading(true);
    const id = driver?.id ?? user?.id ?? '';
    const data = role === 'affiliate'
      ? await documentService.getAffiliateDocuments(id)
      : await documentService.getDriverDocuments(id);
    setDocs(data);
    setLoading(false);
  }, [driver?.id, user?.id, role]);

  useEffect(() => {
    load().catch((error) => {
      setDocs([]);
      setLoading(false);
      Alert.alert('Documents unavailable', error instanceof Error ? error.message : 'Could not load documents.');
    });
  }, [load]);

  const handleUpload = (doc: Document) => {
    setSelectedDoc(doc);
    setExpiryInput(doc.expiryDate ?? '');
  };

  const pickAndUpload = async () => {
    if (!selectedDoc) return;
    const expiryDate = expiryInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      Alert.alert('Expiry date required', 'Please enter the date as YYYY-MM-DD.');
      return;
    }

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets[0]) return;

      const asset = picked.assets[0];
      setUploadingId(selectedDoc.id);
      await documentService.uploadDocument({
        role,
        documentId: selectedDoc.id,
        expiryDate,
        file: {
          uri: asset.uri,
          name: asset.name ?? `${selectedDoc.type}.pdf`,
          mimeType: asset.mimeType,
        },
      });
      setSelectedDoc(null);
      setExpiryInput('');
      await load();
      Alert.alert('Uploaded', `${selectedDoc.label} has been submitted for review.`);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not upload document.');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={ROSE_GOLD} size="large" /></View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.info}>
              <Text style={styles.infoText}>
                Keep your documents up to date. Expired or missing documents may prevent you from receiving jobs.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View>
              <View style={[styles.docCard, item.status === 'expired' || item.status === 'rejected' ? styles.docCardAlert : null]}>
                <View style={styles.docLeft}>
                  <Text style={styles.docIcon}>DOC</Text>
                  <View style={styles.docInfo}>
                    <Text style={styles.docTitle}>{item.label}</Text>
                    {item.expiryDate && <Text style={styles.docExpiry}>Expires: {formatDate(item.expiryDate)}</Text>}
                    {item.uploadedAt && <Text style={styles.docUploadDate}>Uploaded: {formatDate(item.uploadedAt)}</Text>}
                  </View>
                </View>
                <View style={styles.docRight}>
                  <StatusBadge label={item.status.toUpperCase()} color={documentStatusColor(item.status)} />
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => handleUpload(item)}
                    activeOpacity={0.75}
                    disabled={uploadingId === item.id}
                  >
                    <Text style={styles.uploadBtnText}>
                      {uploadingId === item.id ? 'Uploading' : item.status === 'missing' ? 'Upload' : 'Update'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {selectedDoc?.id === item.id && (
                <View style={styles.uploadPanel}>
                  <Text style={styles.uploadPanelTitle}>Expiry date</Text>
                  <TextInput
                    value={expiryInput}
                    onChangeText={setExpiryInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={MUTED}
                    style={styles.expiryInput}
                  />
                  <View style={styles.uploadPanelActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedDoc(null)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickBtn} onPress={pickAndUpload}>
                      <Text style={styles.pickBtnText}>Pick file</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.uploadHint}>Accepted: PDF, JPG, PNG, WEBP.</Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  info: {
    backgroundColor: 'rgba(215,180,106,0.06)', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(215,180,106,0.2)', padding: 12, marginBottom: 16,
  },
  infoText: { color: MUTED, fontSize: 13, lineHeight: 19, fontFamily: FONT_REGULAR ?? undefined },
  docCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: LINE,
    padding: 14, marginBottom: 10,
  },
  docCardAlert: { borderColor: 'rgba(229,57,53,0.4)', backgroundColor: 'rgba(229,57,53,0.04)' },
  docLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  docIcon: { fontSize: 11, color: ROSE_GOLD, fontWeight: '700', paddingTop: 4 },
  docInfo: { flex: 1, gap: 2 },
  docTitle: { fontSize: 14, fontWeight: '600', color: TEXT, fontFamily: FONT_MEDIUM ?? undefined },
  docExpiry: { fontSize: 11, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  docUploadDate: { fontSize: 11, color: MUTED, fontFamily: FONT_REGULAR ?? undefined },
  docRight: { alignItems: 'flex-end', gap: 8 },
  uploadBtn: {
    backgroundColor: 'rgba(215,180,106,0.1)', borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(215,180,106,0.35)', paddingHorizontal: 10, paddingVertical: 5,
  },
  uploadBtnText: { color: ROSE_GOLD, fontSize: 12, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  uploadPanel: {
    backgroundColor: 'rgba(255,255,255,0.035)', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(215,180,106,0.22)', padding: 12, marginTop: -4, marginBottom: 10,
  },
  uploadPanelTitle: { color: TEXT, fontSize: 12, fontWeight: '600', marginBottom: 8, fontFamily: FONT_MEDIUM ?? undefined },
  expiryInput: {
    height: 44, borderRadius: 10, borderWidth: 1, borderColor: LINE, color: TEXT,
    paddingHorizontal: 12, fontSize: 14, fontFamily: FONT_REGULAR ?? undefined,
  },
  uploadPanelActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: CARD },
  cancelBtnText: { color: MUTED, fontWeight: '600', fontFamily: FONT_MEDIUM ?? undefined },
  pickBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: ROSE_GOLD },
  pickBtnText: { color: BLACK, fontWeight: '700', fontFamily: FONT_MEDIUM ?? undefined },
  uploadHint: { color: MUTED, fontSize: 11, marginTop: 8, fontFamily: FONT_REGULAR ?? undefined },
});
