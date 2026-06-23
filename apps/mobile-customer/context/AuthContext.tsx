import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, loginWithGoogle as apiLoginWithGoogle, getProfile, clearToken } from '@/services/api';
import { registerCustomerPushToken } from '@/services/pushNotifications';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextValue {
  customer: Customer | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  customer: null,
  loading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('rp_customer_jwt').then(async token => {
      if (token) {
        try {
          const profile = await getProfile();
          setCustomer({ id: profile.id, name: profile.fullName, email: profile.email, phone: profile.phone });
          registerCustomerPushToken().catch(() => {});
        } catch {
          await clearToken();
        }
      }
      setLoading(false);
    });
  }, []);

  const login = async (identifier: string, password: string) => {
    const user = await apiLogin(identifier, password);
    setCustomer(user);
    registerCustomerPushToken().catch(() => {});
  };

  const loginWithGoogle = async (idToken: string) => {
    const user = await apiLoginWithGoogle(idToken);
    setCustomer(user);
    registerCustomerPushToken().catch(() => {});
  };

  const logout = async () => {
    await clearToken();
    setCustomer(null);
  };

  const refreshProfile = async () => {
    const profile = await getProfile();
    setCustomer({ id: profile.id, name: profile.fullName, email: profile.email, phone: profile.phone });
  };

  return (
    <AuthContext.Provider value={{ customer, loading, login, loginWithGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
