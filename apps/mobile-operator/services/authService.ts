import type { User, UserRole } from '@/types';
import { api, setToken, clearToken } from './apiClient';

const ROLE_MAP: Record<UserRole, string> = {
  affiliate:          'affiliate',
  affiliateDriver:    'driver',
  independentDriver:  'driver',
};

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string; name?: string; fullName?: string; companyName?: string;
    email: string; phone?: string; role: string; isApproved?: boolean; createdAt?: string;
  };
}

export interface ApprovedAffiliate {
  id: string;
  companyName: string;
  tradingName?: string;
  city: string;
}

export const authService = {
  async login(email: string, password: string, role: UserRole): Promise<User> {
    const backendRole = ROLE_MAP[role];
    const res = await api.post<LoginResponse>('/api/auth/login', { email, password, role: backendRole });

    await setToken(res.token);

    const u = res.user;
    return {
      id:             u.id,
      name:           u.name ?? u.fullName ?? u.companyName ?? email.split('@')[0],
      email:          u.email,
      phone:          u.phone ?? '',
      role,
      avatarInitials: (u.name ?? u.fullName ?? u.companyName ?? email).substring(0, 2).toUpperCase(),
      isApproved:     u.isApproved ?? true,
      createdAt:      u.createdAt ?? new Date().toISOString(),
    };
  },

  async logout(): Promise<void> {
    await clearToken();
  },

  async registerAffiliate(data: Record<string, string>): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/api/auth/register/affiliate', data);
  },

  async registerDriver(data: Record<string, string>): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/api/auth/register/driver', data);
  },

  async getApprovedAffiliates(): Promise<ApprovedAffiliate[]> {
    const result = await api.get<{ success: boolean; data: ApprovedAffiliate[] }>('/api/public/affiliates');
    return result.data;
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/api/auth/forgot-password', { email });
  },
};
