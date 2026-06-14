import type { EarningEntry, EarningsSummary } from '@/types';
import { api } from './apiClient';

interface BackendEarning {
  id: string;
  jobId: string;
  bookingRef: string;
  date: string;
  grossAmount: number;
  commissionDeducted: number;
  netAmount: number;
  status: 'paid' | 'pending' | 'processing';
}

interface BackendEarningsResponse {
  success: boolean;
  data: BackendEarning[];
  summary: {
    today?: number;
    thisWeek?: number;
    total: number;
    paid: number;
    pending: number;
    jobCount: number;
  };
}

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function toSummary(response: BackendEarningsResponse): EarningsSummary {
  const entries: EarningEntry[] = response.data.map(entry => ({
    id: entry.id,
    jobId: entry.jobId,
    bookingRef: entry.bookingRef,
    date: entry.date,
    amount: entry.grossAmount,
    commissionDeducted: entry.commissionDeducted,
    netAmount: entry.netAmount,
    status: entry.status,
  }));
  const monthStart = startOfMonthIso();
  return {
    todayEarnings: response.summary.today ?? 0,
    weeklyEarnings: response.summary.thisWeek ?? 0,
    monthlyEarnings: entries
      .filter(entry => entry.date >= monthStart)
      .reduce((sum, entry) => sum + entry.netAmount, 0),
    totalEarnings: response.summary.total,
    completedJobs: response.summary.jobCount,
    pendingPayout: response.summary.pending,
    entries,
  };
}

export const earningsService = {
  async getAffiliateEarnings(_affiliateId: string): Promise<EarningsSummary> {
    const r = await api.get<BackendEarningsResponse>('/api/affiliate/earnings');
    return toSummary(r);
  },

  async getDriverEarnings(_driverId: string): Promise<EarningsSummary> {
    const r = await api.get<BackendEarningsResponse>('/api/driver/earnings');
    return toSummary(r);
  },
};
