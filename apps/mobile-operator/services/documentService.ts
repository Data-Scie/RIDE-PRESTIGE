import type { Document, UserRole } from '@/types';
import { api } from './apiClient';

type UploadTarget = {
  role: UserRole;
  documentId: string;
  file: { uri: string; name: string; mimeType?: string };
  expiryDate: string;
};

export const documentService = {
  async getDriverDocuments(_driverId: string): Promise<Document[]> {
    const r = await api.get<{ success: boolean; data: Document[] }>('/api/driver/documents');
    return r.data;
  },

  async getAffiliateDocuments(_affiliateId: string): Promise<Document[]> {
    const r = await api.get<{ success: boolean; data: Document[] }>('/api/affiliate/documents');
    return r.data;
  },

  async uploadDocument({ role, documentId, file, expiryDate }: UploadTarget): Promise<{ success: boolean; data: Document }> {
    const form = new FormData();
    form.append('expiryDate', expiryDate);
    form.append('document', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'application/octet-stream',
    } as unknown as Blob);

    const segment = role === 'affiliate' ? 'affiliate' : 'driver';
    return api.upload<{ success: boolean; data: Document }>(`/api/${segment}/documents/${documentId}/upload`, form);
  },
};
