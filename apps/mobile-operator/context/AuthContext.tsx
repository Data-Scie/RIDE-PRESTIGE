import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthContextType, Affiliate, Driver, User, UserRole } from '@/types';
import { authService } from '@/services/authService';
import { api, clearToken, getToken } from '@/services/apiClient';
import { registerPushToken } from '@/services/pushNotifications';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateProfile = useCallback(async (currentUser: User): Promise<User> => {
    if (currentUser.role === 'affiliate') {
      const r = await api.get<{ success: boolean; data: Affiliate }>('/api/affiliate/profile').catch(() => null);
      if (r) setAffiliate(r.data);
      setDriver(null);
      return currentUser;
    }

    const r = await api.get<{ success: boolean; data: Driver }>('/api/driver/profile').catch(() => null);
    setAffiliate(null);
    if (!r) return currentUser;

    setDriver(r.data);
    return { ...currentUser, role: r.data.driverType };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const restoredUser = await authService.me();
        const hydratedUser = await hydrateProfile(restoredUser);
        if (!cancelled) setUser(hydratedUser);
      } catch {
        await clearToken();
        if (!cancelled) {
          setUser(null);
          setAffiliate(null);
          setDriver(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restore();
    return () => { cancelled = true; };
  }, [hydrateProfile]);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const loggedInUser = await authService.login(email, password, role);
      const hydratedUser = await hydrateProfile(loggedInUser);
      setUser(hydratedUser);
      registerPushToken(hydratedUser.role).catch(() => {});
    } finally {
      setIsLoading(false);
    }
  }, [hydrateProfile]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setAffiliate(null);
    setDriver(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, affiliate, driver, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
