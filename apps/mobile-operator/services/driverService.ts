import type { Driver, DriverStatus } from '@/types';
import { api } from './apiClient';

export const driverService = {
  async getAffiliateDrivers(_affiliateId: string): Promise<Driver[]> {
    const r = await api.get<{ success: boolean; data: Driver[] }>('/api/affiliate/drivers');
    return r.data;
  },

  async getAvailableDrivers(_affiliateId: string, jobId?: string): Promise<Driver[]> {
    const qs = new URLSearchParams({ status: 'available' });
    if (jobId) qs.set('jobId', jobId);
    const r = await api.get<{ success: boolean; data: Driver[] }>(`/api/affiliate/drivers?${qs.toString()}`);
    return r.data;
  },

  async getDriverById(driverId: string): Promise<Driver | undefined> {
    try {
      const r = await api.get<{ success: boolean; data: Driver }>(`/api/affiliate/drivers/${driverId}`);
      return r.data;
    } catch {
      return undefined;
    }
  },

  async addDriver(data: Omit<Driver, 'id' | 'totalJobs' | 'totalEarnings' | 'rating'>): Promise<Driver> {
    const r = await api.post<{ success: boolean; data: Driver }>('/api/affiliate/drivers', data);
    return r.data;
  },

  async updateDriverStatus(driverId: string, status: DriverStatus): Promise<Driver> {
    const r = await api.put<{ success: boolean; data: Driver }>(`/api/affiliate/drivers/${driverId}/status`, { status });
    return r.data;
  },

  async getDashboardStats(_driverId: string) {
    const r = await api.get<{ success: boolean; data: {
      todayJobs: number; completedJobs: number; rating: number;
      documentsStatus: string; currentRideId: string | null;
    } }>('/api/driver/dashboard');
    return r.data;
  },
};
