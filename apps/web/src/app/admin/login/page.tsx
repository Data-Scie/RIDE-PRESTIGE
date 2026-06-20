'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PortalLoginShell, PortalSubmitButton, portalInputStyle, portalInputFocusHandlers } from '@/components/auth/PortalLoginShell';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.error || data.message || 'Invalid email or password. Please try again.');
      }
    } catch { setError('Something went wrong. Is the backend running?'); }
    finally { setLoading(false); }
  };

  return (
    <PortalLoginShell
      title="Administration Portal"
      subtitle="Ride Prestige — Administration Access"
      badgeLabel="Secure Administration Access"
      error={error}
      onSubmit={handleSubmit}
    >
      <div>
        <label htmlFor="admin-login-email" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Email address</label>
        <input id="admin-login-email" type="email" autoComplete="email" placeholder="admin@rideprestige.co.uk"
          value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={portalInputStyle} {...portalInputFocusHandlers}
        />
      </div>
      <div>
        <label htmlFor="admin-login-password" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Password</label>
        <div className="relative">
          <input id="admin-login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
            value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
            className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all"
            style={portalInputStyle} {...portalInputFocusHandlers}
          />
          <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      <PortalSubmitButton loading={loading} label="Sign In" loadingLabel="Signing in…" />
    </PortalLoginShell>
  );
}
