'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { setCookie, getPortalToken } from '@/lib/api-client';

// Bridges a Google-authenticated NextAuth session into the rp_customer_jwt cookie
// the rest of the app (customerApi, /book, /account) already reads.
export default function CustomerSessionBridge() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;
    const backendToken = (session as typeof session & { backendToken?: string })?.backendToken;
    if (!backendToken) return;
    if (getPortalToken('customer') === backendToken) return;
    setCookie('rp_customer_jwt', backendToken);
  }, [session, status]);

  return null;
}
