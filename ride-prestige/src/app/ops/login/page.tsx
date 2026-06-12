'use client';
import { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function OpsLoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/ops/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = '/ops/dashboard';
      } else {
        setError(data.error || 'Invalid credentials.');
        setLoading(false);
      }
    } catch {
      setError('Could not reach server. Make sure the backend is running.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 8px 32px rgba(59,130,246,0.35)' }}>
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Operations Portal</h1>
          <p className="text-slate-400 text-sm">Ride Prestige — Admin Operations</p>
        </div>

        <div className="rounded-3xl p-8" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
          {error && <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ops@rideprestige.co.uk" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontFamily: 'inherit' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign in to Operations'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4 text-slate-600">Restricted access — authorised personnel only</p>
        <p className="text-center text-xs mt-2 text-slate-700">ops@rideprestige.co.uk / Ops@2026!</p>
      </div>
    </div>
  );
}
