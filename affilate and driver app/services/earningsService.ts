import type { EarningsSummary } from '@/types';
import { api } from './apiClient';

export const earningsService = {
  async getAffiliateEarnings(_affiliateId: string): Promise<EarningsSummary> {
    const r = await api.get<{ success: boolean; data: EarningsSummary }>('/api/affiliate/earnings');
    return r.data;
  },

  async getDriverEarnings(_driverId: string): Promise<EarningsSummary> {
    const r = await api.get<{ success: boolean; data: EarningsSummary }>('/api/driver/earnings');
    return r.data;
  },
};
