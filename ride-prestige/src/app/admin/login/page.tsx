'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

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
      if (res.ok) { window.location.href = '/admin/dashboard'; }
      else setError('Invalid email or password. Please try again.');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#000000' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />

      <div className="relative w-full max-w-sm mx-4">
        <div className="text-center mb-10">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-5"
            style={{ background:'linear-gradient(135deg,#c9a84c,#e8c96d,#a07c30)', boxShadow:'0 8px 40px rgba(201,168,76,0.3)' }}>
            <span style={{ color:'#000000', fontFamily:'Playfair Display,Georgia,serif', fontWeight:700, fontSize:'15px' }}>RP</span>
          </div>
          <h1 style={{ fontFamily:'Playfair Display,Georgia,serif', color:'white', fontSize:'1.6rem', fontWeight:600 }}>Admin Panel</h1>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.82rem', marginTop:'5px' }}>Sign in to Ride Prestige CMS</p>
        </div>

        <div className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 20px 80px rgba(0,0,0,0.6)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
            style={{ background:'linear-gradient(90deg,#c9a84c,#e8c96d,#a07c30)' }} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2" style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.68rem', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                Email address
              </label>
              <input type="email" autoComplete="email" placeholder="admin@rideprestige.co.uk"
                value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontFamily:'inherit' }}
                onFocus={e => { e.target.style.borderColor='#c9a84c'; e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.15)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; }}
              />
            </div>

            <div>
              <label className="block mb-2" style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.68rem', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                Password
              </label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none"
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontFamily:'inherit' }}
                  onFocus={e => { e.target.style.borderColor='#c9a84c'; e.target.style.boxShadow='0 0 0 3px rgba(201,168,76,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; }}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color:'rgba(255,255,255,0.35)' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm"
              style={{ background: loading ? 'rgba(201,168,76,0.5)' : 'linear-gradient(135deg,#c9a84c,#e8c96d,#a07c30)', color:'#000000', boxShadow: loading ? 'none' : '0 4px 24px rgba(201,168,76,0.3)', cursor: loading ? 'wait' : 'pointer', border:'none', fontFamily:'inherit' }}>
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

          <p className="text-center mt-5 text-xs" style={{ color:'rgba(255,255,255,0.2)' }}>
            Demo: admin@rideprestige.co.uk &bull; Admin123!
          </p>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color:'rgba(255,255,255,0.15)' }}>
          Ride Prestige &copy; 2026 &mdash; Admin CMS
        </p>
      </div>
    </div>
  );
}
