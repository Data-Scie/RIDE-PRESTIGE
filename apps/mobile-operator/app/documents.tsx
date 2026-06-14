import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
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

  useEffect(() => {
    const id = driver?.id ?? user?.id ?? '';
    documentService.getDriverDocuments(id).then((data) => {
      setDocs(data);
      setLoading(false);
    });
  }, [driver?.id, user?.id]);

  const handleUpload = (doc: Document) => {
    Alert.alert(
      'Upload Document',
      `Upload or update your ${doc.label}?\n\nThis will open your device camera or file picker.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upload', onPress: () => Alert.alert('Demo', 'Document upload feature will be connected to backend.') },
      ],
    );
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
            <View style={[styles.docCard, item.status === 'expired' || item.status === 'rejected' ? styles.docCardAlert : null]}>
              <View style={styles.docLeft}>
                <Text style={styles.docIcon}>📄</Text>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>{item.label}</Text>
                  {item.expiryDate && (
                    <Text style={styles.docExpiry}>Expires: {formatDate(item.expiryDate)}</Text>
                  )}
                  {item.uploadedAt && (
                    <Text style={styles.docUploadDate}>Uploaded: {formatDate(item.uploadedAt)}</Text>
                  )}
                </View>
              </View>
              <View style={styles.docRight}>
                <StatusBadge
                  label={item.status.toUpperCase()}
                  color={documentStatusColor(item.status)}
                />
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={() => handleUpload(item)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.uploadBtnText}>
                    {item.status === 'missing' ? 'Upload' : 'Update'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  docIcon: { fontSize: 26 },
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
});
