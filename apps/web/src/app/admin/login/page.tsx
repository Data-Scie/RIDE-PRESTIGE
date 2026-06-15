'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, AlertCircle, Shield } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';

export default function AdminLoginPage() {
  const router = useRouter();
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

  const GOLD = '#c9a84c';

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f5f8' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,168,76,0.04) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(201,168,76,0.03) 0%, transparent 50%)' }} />

      <div className="relative w-full max-w-sm mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <BrandLogo variant="mark" width={68} className="mx-auto mb-5" />
          <h1 style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e', fontSize: '1.7rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
            Prestige Admin Panel
          </h1>
          <p style={{ color: '#8b8fa8', fontSize: '0.83rem', marginTop: '6px' }}>Sign in to your administration account</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8"
          style={{ background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 4px 40px rgba(0,0,0,0.07)' }}>

          {/* Secure badge */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <Shield size={11} style={{ color: GOLD }} />
            <span style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Secure Administration Access
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2"
                style={{ color: '#6b7280', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Email address
              </label>
              <input type="email" autoComplete="email" placeholder="admin@rideprestige.co.uk"
                value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: '#f4f5f8', border: '1px solid #e5e7eb', color: '#0a0f1e', fontFamily: 'inherit' }}
                onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.1)'; e.target.style.background = 'white'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f4f5f8'; }}
              />
            </div>

            <div>
              <label className="block mb-2"
                style={{ color: '#6b7280', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Password
              </label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all"
                  style={{ background: '#f4f5f8', border: '1px solid #e5e7eb', color: '#0a0f1e', fontFamily: 'inherit' }}
                  onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.1)'; e.target.style.background = 'white'; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f4f5f8'; }}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#9ca3af' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertCircle size={14} className="shrink-0" style={{ color: '#ef4444' }} />
                <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: loading ? '#e5c878' : 'linear-gradient(135deg,#c9a84c,#e8c96d,#a07c30)',
                color: '#000000',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(201,168,76,0.25)',
                cursor: loading ? 'wait' : 'pointer',
                border: 'none',
                fontFamily: 'inherit',
              }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <><LogIn size={15} /> Sign In</>
              )}
            </button>
          </form>

        </div>

        <p className="text-center mt-6 text-xs" style={{ color: '#d1d5db' }}>
          &copy; 2026 Ride Prestige Ltd &mdash; Administration Portal
        </p>
      </div>
    </div>
  );
}
