'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Car, CheckCircle } from 'lucide-react';

export default function DriverRegisterPage() {
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', licenseNo: '', vehicleModel: '', vehicleReg: '', vehicleColor: '', password: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep('done');
  };

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="max-w-md text-center px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(245,158,11,0.15)' }}><CheckCircle size={40} className="text-amber-400" /></div>
        <h1 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Application Received!</h1>
        <p className="text-zinc-400 mb-6">We&apos;ll review your application and contact you at <strong className="text-white">{form.email}</strong> within 24-48 hours after document verification.</p>
        <Link href="/driver/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-black" style={{ background: '#f59e0b' }}>Go to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: '#0a0a0a' }}>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Car size={24} className="text-white" /></div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Apply to Drive</h1>
          <p className="text-zinc-500 text-sm mt-1">Join the Ride Prestige driver network</p>
        </div>
        <div className="rounded-3xl p-8" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Personal Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Full name *</label>
                <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Email *</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Phone *</label>
                <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 7700..." className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit' }} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Driver licence no. *</label>
                <input required value={form.licenseNo} onChange={e => set('licenseNo', e.target.value)} placeholder="SURNA010101XX9XX" className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white font-mono" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace' }} />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mt-4 mb-2">Vehicle Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Vehicle make & model *</label>
                <input required value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)} placeholder="e.g. Toyota Corolla" className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Registration *</label>
                <input required value={form.vehicleReg} onChange={e => set('vehicleReg', e.target.value.toUpperCase())} placeholder="SH21 ABC" className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white font-mono" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Colour</label>
                <input value={form.vehicleColor} onChange={e => set('vehicleColor', e.target.value)} placeholder="White" className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit' }} />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mt-4 mb-2">Account</p>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Password *</label>
              <input required type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" minLength={8} className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-sm mt-4" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
            <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Already registered? <Link href="/driver/login" className="text-amber-400 font-semibold">Sign in</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
}
