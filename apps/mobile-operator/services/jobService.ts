import type { Job, JobStatus } from '@/types';
import { api } from './apiClient';

interface ApiJobResponse { success: boolean; data: Job | Job[]; }

export const jobService = {
  async getNewJobs(): Promise<Job[]> {
    const r = await api.get<ApiJobResponse>('/api/affiliate/jobs/new');
    return r.data as Job[];
  },

  async getAcceptedJobs(_affiliateId: string): Promise<Job[]> {
    const r = await api.get<ApiJobResponse>('/api/affiliate/jobs/accepted');
    return r.data as Job[];
  },

  async getDriverJobs(_driverId: string): Promise<Job[]> {
    const r = await api.get<ApiJobResponse>('/api/driver/jobs/my');
    return r.data as Job[];
  },

  async getOpenJobs(): Promise<Job[]> {
    const r = await api.get<ApiJobResponse>('/api/driver/jobs/available');
    return r.data as Job[];
  },

  async getJobById(id: string): Promise<Job | undefined> {
    try {
      const r = await api.get<{ success: boolean; data: Job }>(`/api/affiliate/jobs/${id}`);
      return r.data;
    } catch {
      return undefined;
    }
  },

  async getDriverJobById(id: string): Promise<Job | undefined> {
    try {
      const r = await api.get<{ success: boolean; data: Job }>(`/api/driver/jobs/${id}`);
      return r.data;
    } catch {
      return undefined;
    }
  },

  async acceptJob(jobId: string, _affiliateId: string): Promise<Job> {
    const r = await api.post<{ success: boolean; data: Job }>(`/api/affiliate/jobs/${jobId}/accept`, {});
    return r.data;
  },

  async rejectJob(jobId: string): Promise<Job> {
    const r = await api.post<{ success: boolean; data: Job }>(`/api/affiliate/jobs/${jobId}/reject`, {});
    return r.data;
  },

  async assignDriver(jobId: string, driverId: string): Promise<Job> {
    const r = await api.post<{ success: boolean; data: Job }>(`/api/affiliate/jobs/${jobId}/assign-driver`, { driverId });
    return r.data;
  },

  async assignVehicle(jobId: string, vehicleId: string): Promise<Job> {
    const r = await api.post<{ success: boolean; data: Job }>(`/api/affiliate/jobs/${jobId}/assign-vehicle`, { vehicleId });
    return r.data;
  },

  async driverAcceptJob(jobId: string): Promise<Job> {
    const r = await api.post<{ success: boolean; data: Job }>(`/api/driver/jobs/${jobId}/accept`, {});
    return r.data;
  },

  async claimJob(jobId: string): Promise<Job> {
    const r = await api.post<{ success: boolean; data: Job }>(`/api/driver/jobs/${jobId}/claim`, {});
    return r.data;
  },

  async updateRideStatus(jobId: string, status: JobStatus): Promise<Job> {
    const r = await api.put<{ success: boolean; data: Job }>(`/api/driver/jobs/${jobId}/status`, { status });
    return r.data;
  },

  async getCurrentJob(): Promise<Job | null> {
    try {
      const r = await api.get<{ success: boolean; data: Job | null }>('/api/driver/jobs/current');
      return r.data;
    } catch {
      return null;
    }
  },

  async getJobHistory(): Promise<Job[]> {
    const r = await api.get<ApiJobResponse>('/api/driver/jobs/history');
    return r.data as Job[];
  },
};
