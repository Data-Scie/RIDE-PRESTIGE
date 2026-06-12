'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, CheckCircle } from 'lucide-react';

export default function AffiliateRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'submitted'>('form');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', address: '', regNumber: '', password: '', vehicleCount: '', driverCount: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep('submitted');
  };

  if (step === 'submitted') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md text-center px-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"><CheckCircle size={40} className="text-green-500" /></div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Application Submitted!</h1>
        <p className="text-slate-600 mb-6">Your application has been received. Our team will review it within 24-48 hours and contact you at <strong>{form.email}</strong>.</p>
        <Link href="/affiliate/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white" style={{ background: '#10b981' }}>Back to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Join as an Affiliate</h1>
          <p className="text-slate-500 text-sm mt-1">Register your company to receive ride requests from Ride Prestige</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Company Information</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Company name *</label>
                <input required value={form.companyName} onChange={e => set('companyName', e.target.value)} className="input-field" placeholder="Sheffield Premier Cars Ltd" />
              </div>
              <div>
                <label className="label">Company registration no.</label>
                <input value={form.regNumber} onChange={e => set('regNumber', e.target.value)} className="input-field" placeholder="12345678" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Business address *</label>
                <input required value={form.address} onChange={e => set('address', e.target.value)} className="input-field" placeholder="12 Example Street, Sheffield, S1 1AB" />
              </div>
              <div>
                <label className="label">No. of vehicles</label>
                <input type="number" min="1" value={form.vehicleCount} onChange={e => set('vehicleCount', e.target.value)} className="input-field" placeholder="5" />
              </div>
              <div>
                <label className="label">No. of drivers</label>
                <input type="number" min="1" value={form.driverCount} onChange={e => set('driverCount', e.target.value)} className="input-field" placeholder="6" />
              </div>
            </div>
            <div className="pt-3 pb-2 border-t border-slate-100">
              <h2 className="font-semibold text-slate-800">Contact & Account</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Contact name *</label>
                <input required value={form.contactName} onChange={e => set('contactName', e.target.value)} className="input-field" placeholder="Your full name" />
              </div>
              <div>
                <label className="label">Phone number *</label>
                <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="+44 114 000 0000" />
              </div>
              <div>
                <label className="label">Email address *</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="info@yourcompany.co.uk" />
              </div>
              <div>
                <label className="label">Password *</label>
                <input required type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-field" placeholder="Min 8 characters" minLength={8} />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Submitting application…' : 'Submit application'}
              </button>
              <p className="text-center text-xs text-slate-400 mt-3">Already registered? <Link href="/affiliate/login" className="text-green-600 font-medium">Sign in</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
