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

interface MeResponse {
  success: boolean;
  user: LoginResponse['user'] & {
    driverType?: 'affiliateDriver' | 'independentDriver';
  };
}

export interface ApprovedAffiliate {
  id: string;
  companyName: string;
  tradingName?: string;
  city: string;
}

export const authService = {
  userFromProfile(profile: MeResponse['user'], fallbackRole: UserRole): User {
    const role = profile.role === 'affiliate'
      ? 'affiliate'
      : profile.driverType === 'independentDriver'
        ? 'independentDriver'
        : profile.driverType === 'affiliateDriver'
          ? 'affiliateDriver'
          : fallbackRole;

    const displayName = profile.name ?? profile.fullName ?? profile.companyName ?? profile.email;
    return {
      id:             profile.id,
      name:           displayName,
      email:          profile.email,
      phone:          profile.phone ?? '',
      role,
      avatarInitials: displayName.substring(0, 2).toUpperCase(),
      isApproved:     profile.isApproved ?? true,
      createdAt:      profile.createdAt ?? new Date().toISOString(),
    };
  },

  async login(email: string, password: string, role: UserRole): Promise<User> {
    const backendRole = ROLE_MAP[role];
    const res = await api.post<LoginResponse>('/api/auth/login', { email, password, role: backendRole });

    await setToken(res.token);

    return this.userFromProfile(res.user, role);
  },

  async me(): Promise<User> {
    const res = await api.get<MeResponse>('/api/auth/me');
    return this.userFromProfile(res.user, res.user.role === 'affiliate' ? 'affiliate' : 'affiliateDriver');
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
