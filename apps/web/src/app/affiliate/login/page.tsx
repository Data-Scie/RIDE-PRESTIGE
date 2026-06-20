'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { GOLD, PortalLoginShell, PortalSubmitButton, portalInputStyle, portalInputFocusHandlers } from '@/components/auth/PortalLoginShell';

export default function AffiliateLoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/affiliate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = '/affiliate/dashboard';
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Could not reach server. Make sure the backend is running.');
      setLoading(false);
    }
  };

  return (
    <PortalLoginShell
      title="Affiliate Portal"
      subtitle="Ride Prestige — Partner Access"
      badgeLabel="Secure Partner Access"
      error={error}
      onSubmit={handleLogin}
      footer={<>Not registered? <Link href="/affiliate/register" className="font-semibold" style={{ color: GOLD }}>Apply to join</Link></>}
    >
      <div>
        <label htmlFor="affiliate-login-email" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Email address</label>
        <input id="affiliate-login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="info@yourcompany.co.uk"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all" style={portalInputStyle} {...portalInputFocusHandlers} />
      </div>
      <div>
        <label htmlFor="affiliate-login-password" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Password</label>
        <div className="relative">
          <input id="affiliate-login-password" type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all" style={portalInputStyle} {...portalInputFocusHandlers} />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
      </div>
      <PortalSubmitButton loading={loading} label="Sign In" loadingLabel="Signing in…" />
    </PortalLoginShell>
  );
}
