'use client';

import { SessionProvider } from 'next-auth/react';
import CustomerSessionBridge from './CustomerSessionBridge';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CustomerSessionBridge />
      {children}
    </SessionProvider>
  );
}
