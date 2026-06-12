import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AuthContextType, User, UserRole, Affiliate, Driver } from '@/types';
import { authService } from '@/services/authService';
import { api } from '@/services/apiClient';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [driver, setDriver]       = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const loggedInUser = await authService.login(email, password, role);
      setUser(loggedInUser);

      if (role === 'affiliate') {
        const r = await api.get<{ success: boolean; data: Affiliate }>('/api/affiliate/profile').catch(() => null);
        if (r) setAffiliate(r.data);
      } else if (role === 'affiliateDriver' || role === 'independentDriver') {
        const r = await api.get<{ success: boolean; data: Driver }>('/api/driver/profile').catch(() => null);
        if (r) setDriver(r.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

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
