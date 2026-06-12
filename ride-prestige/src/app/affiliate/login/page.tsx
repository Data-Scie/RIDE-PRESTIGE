'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Building2, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 32px rgba(16,185,129,0.25)' }}>
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Affiliate Portal</h1>
          <p className="text-slate-500 text-sm">Ride Prestige — Partner Access</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          {error && <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="info@yourcompany.co.uk" className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-2" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-5">Not registered? <Link href="/affiliate/register" className="text-green-600 font-semibold hover:text-green-700">Apply to join</Link></p>
        </div>
        <p className="text-center text-xs mt-3 text-slate-400">Demo: affiliate@settransfers.co.uk / Affiliate@123</p>
      </div>
    </div>
  );
}
