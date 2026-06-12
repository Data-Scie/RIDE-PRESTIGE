import type { Vehicle, VehicleStatus } from '@/types';
import { api } from './apiClient';

export const vehicleService = {
  async getAffiliateVehicles(_affiliateId: string): Promise<Vehicle[]> {
    const r = await api.get<{ success: boolean; data: Vehicle[] }>('/api/affiliate/vehicles');
    return r.data;
  },

  async getAvailableVehicles(_affiliateId: string): Promise<Vehicle[]> {
    const r = await api.get<{ success: boolean; data: Vehicle[] }>('/api/affiliate/vehicles?status=available');
    return r.data;
  },

  async getVehicleById(vehicleId: string): Promise<Vehicle | undefined> {
    try {
      const r = await api.get<{ success: boolean; data: Vehicle }>(`/api/affiliate/vehicles/${vehicleId}`);
      return r.data;
    } catch {
      return undefined;
    }
  },

  async addVehicle(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const r = await api.post<{ success: boolean; data: Vehicle }>('/api/affiliate/vehicles', data);
    return r.data;
  },

  async updateVehicleStatus(vehicleId: string, status: VehicleStatus): Promise<Vehicle> {
    const r = await api.put<{ success: boolean; data: Vehicle }>(`/api/affiliate/vehicles/${vehicleId}/status`, { status });
    return r.data;
  },
};
