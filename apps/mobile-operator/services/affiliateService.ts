import type { Affiliate } from '@/types';
import { api } from './apiClient';

export const affiliateService = {
  async getAffiliate(_affiliateId: string): Promise<Affiliate> {
    const r = await api.get<{ success: boolean; data: Affiliate }>('/api/affiliate/profile');
    return r.data;
  },

  async updateAffiliate(_affiliateId: string, updates: Partial<Affiliate>): Promise<Affiliate> {
    const r = await api.put<{ success: boolean; data: Affiliate }>('/api/affiliate/profile', updates);
    return r.data;
  },

  async getDashboardStats(_affiliateId: string) {
    const r = await api.get<{ success: boolean; data: {
      newJobs: number; acceptedJobs: number; driversAvailable: number;
      vehiclesAvailable: number; todayEarnings: number; pendingAllocations: number;
    } }>('/api/affiliate/dashboard');
    return r.data;
  },
};
