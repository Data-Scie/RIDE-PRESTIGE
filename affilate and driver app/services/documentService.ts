import type { Document } from '@/types';
import { api } from './apiClient';

export const documentService = {
  async getDriverDocuments(_driverId: string): Promise<Document[]> {
    const r = await api.get<{ success: boolean; data: Document[] }>('/api/driver/documents');
    return r.data;
  },

  async getAffiliateDocuments(_affiliateId: string): Promise<Document[]> {
    const r = await api.get<{ success: boolean; data: Document[] }>('/api/affiliate/documents');
    return r.data;
  },

  async uploadDocument(_entityId: string, _documentType: string, _uri: string): Promise<{ success: boolean }> {
    return { success: true };
  },
};
