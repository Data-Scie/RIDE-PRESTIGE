'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, CheckCircle, User, Building2, FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const DRIVER_DOCUMENTS = [
  { type: 'driving_licence', label: 'Driving Licence', expiry: true },
  { type: 'phv_badge', label: 'PHV Badge', expiry: true },
  { type: 'dbs_check', label: 'DBS Check', expiry: false },
  { type: 'insurance', label: 'Insurance Certificate', expiry: true },
] as const;

interface Affiliate { id: string; companyName: string; tradingName: string; city: string; }

const inp: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem',
  outline: 'none', color: 'white', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#71717a',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
};

export default function DriverRegisterPage() {
  const [step, setStep]       = useState<'form' | 'done'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [driverType, setDriverType] = useState<'independentDriver' | 'affiliateDriver'>('independentDriver');
  const [documents, setDocuments] = useState<Record<string, File | null>>({});
  const [documentExpiries, setDocumentExpiries] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    address: '', city: '', postcode: '', dateOfBirth: '',
    drivingLicenceNumber: '', privateHireBadgeNumber: '',
    affiliateId: '', password: '',
  });

  useEffect(() => {
    fetch(`${API_URL}/api/public/affiliates`)
      .then(r => r.json())
      .then(d => { if (d.success) setAffiliates(d.data); })
      .catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (driverType === 'affiliateDriver' && !form.affiliateId) {
      setError('Please select an affiliate company.'); return;
    }
    setLoading(true); setError('');
    try {
      const body = new FormData();
      Object.entries({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postcode: form.postcode,
        dateOfBirth: form.dateOfBirth,
        drivingLicenceNumber: form.drivingLicenceNumber,
        privateHireBadgeNumber: form.privateHireBadgeNumber,
        password: form.password,
        driverType,
      }).forEach(([key, value]) => body.append(key, value));
      if (driverType === 'affiliateDriver' && form.affiliateId) body.append('affiliateId', form.affiliateId);
      DRIVER_DOCUMENTS.forEach(document => {
        const file = documents[document.type];
        if (file) body.append(`document_${document.type}`, file);
        if (documentExpiries[document.type]) body.append(`expiry_${document.type}`, documentExpiries[document.type]);
      });

      const res = await fetch(`${API_URL}/api/auth/register/driver`, {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Registration failed.'); return; }
      setStep('done');
    } catch {
      setError('Could not reach server. Please check the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="max-w-md text-center px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(245,158,11,0.12)' }}>
          <CheckCircle size={40} className="text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Application Submitted!</h1>
        <p className="text-zinc-400 mb-2">Your application is pending review by the operations team.</p>
        <p className="text-zinc-500 text-sm mb-2">
          We&apos;ll contact <strong className="text-white">{form.email}</strong> within 24–48 hours once verified.
        </p>
        {driverType === 'affiliateDriver' && (
          <p className="text-xs text-amber-600 mb-5">Once approved, you will appear in your affiliate company&apos;s driver roster.</p>
        )}
        {driverType === 'independentDriver' && (
          <p className="text-xs text-amber-600 mb-5">Once approved, log in to the driver portal to register your vehicle and submit vehicle documents for Operations approval.</p>
        )}
        <Link href="/driver/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-black" style={{ background: '#f59e0b' }}>
          Go to Login
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: '#0a0a0a' }}>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <Car size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Apply to Drive</h1>
          <p className="text-zinc-500 text-sm mt-1">Join the Ride Prestige driver network — Sheffield, UK</p>
        </div>

        <div className="rounded-3xl p-8" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {/* Driver type */}
          <div className="mb-6">
            <p style={{ ...lbl, marginBottom: '12px' }}>I am applying as *</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'independentDriver' as const, label: 'Independent Driver', sub: 'Apply first, add car after approval', Icon: User },
                { value: 'affiliateDriver'   as const, label: 'Affiliate Driver',   sub: 'Under a company',        Icon: Building2 },
              ] as const).map(({ value, label, sub, Icon }) => {
                const active = driverType === value;
                return (
                  <button key={value} type="button" onClick={() => { setDriverType(value); setError(''); }}
                    className="flex flex-col items-center p-4 rounded-2xl text-center transition-all"
                    style={{ border: `2px solid ${active ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(245,158,11,0.08)' : 'transparent' }}>
                    <Icon size={20} style={{ color: active ? '#f59e0b' : '#71717a', marginBottom: '8px' }} />
                    <p className="text-sm font-semibold" style={{ color: active ? '#f59e0b' : 'rgba(255,255,255,0.5)' }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Affiliate selector */}
          {driverType === 'affiliateDriver' && (
            <div className="mb-6 p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <label style={lbl}>Your affiliate company *</label>
              <select value={form.affiliateId} onChange={e => set('affiliateId', e.target.value)}
                style={{ ...inp, cursor: 'pointer' }}>
                <option value="">— Select your employer —</option>
                {affiliates.map(a => (
                  <option key={a.id} value={a.id}>{a.companyName}{a.city ? ` — ${a.city}` : ''}</option>
                ))}
              </select>
              {affiliates.length === 0 && (
                <p className="text-xs mt-2 text-amber-700">No approved companies found. Contact ops if your company is not listed.</p>
              )}
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.18)' }}>
                Once approved, you will appear in this company&apos;s driver roster on the affiliate portal.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Personal Details</p>
              <div className="space-y-3">
                <div>
                  <label style={lbl}>Full legal name *</label>
                  <input required value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="As on your driving licence" style={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={lbl}>Email *</label>
                    <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Phone *</label>
                    <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 7700 000000" style={inp} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Date of birth *</label>
                  <input required type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} style={{ ...inp, colorScheme: 'dark' }} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Home Address</p>
              <div className="space-y-3">
                <div>
                  <label style={lbl}>Street address *</label>
                  <input required value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Oak Street" style={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={lbl}>City *</label>
                    <input required value={form.city} onChange={e => set('city', e.target.value)} placeholder="Sheffield" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Postcode *</label>
                    <input required value={form.postcode} onChange={e => set('postcode', e.target.value.toUpperCase())} placeholder="S1 1AB" style={inp} />
                  </div>
                </div>
              </div>
            </div>

            {/* Licences */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Licence &amp; Compliance</p>
              <div className="space-y-3">
                <div>
                  <label style={lbl}>DVLA driving licence number *</label>
                  <input required value={form.drivingLicenceNumber}
                    onChange={e => set('drivingLicenceNumber', e.target.value.toUpperCase())}
                    placeholder="SURNA010101XX9XX" style={{ ...inp, fontFamily: 'monospace', letterSpacing: '0.05em' }} />
                </div>
                <div>
                  <label style={lbl}>PHV badge number *</label>
                  <input required value={form.privateHireBadgeNumber}
                    onChange={e => set('privateHireBadgeNumber', e.target.value.toUpperCase())}
                    placeholder="SY-PHV-XXXX" style={{ ...inp, fontFamily: 'monospace', letterSpacing: '0.05em' }} />
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>Private Hire Vehicle licence issued by your local council</p>
                </div>
              </div>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">Account Security</p>
              <div>
                <label style={lbl}>Password *</label>
                <input required type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 8 characters" minLength={8} style={inp} />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                <FileText size={14} /> Compliance Documents
              </p>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Upload your current documents with the application. Missing files can still be added later from the driver portal.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {DRIVER_DOCUMENTS.map(document => (
                  <div key={document.type} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={lbl}>{document.label}</label>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={e => setDocuments(prev => ({ ...prev, [document.type]: e.target.files?.[0] ?? null }))}
                      className="block w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-200"
                    />
                    {document.expiry && (
                      <div className="mt-3">
                        <label style={lbl}>Expiry date</label>
                        <input
                          type="date"
                          value={documentExpiries[document.type] ?? ''}
                          onChange={e => setDocumentExpiries(prev => ({ ...prev, [document.type]: e.target.value }))}
                          style={{ ...inp, colorScheme: 'dark' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-sm mt-2"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Submitting application…' : 'Submit Driver Application'}
            </button>

            <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Already registered? <Link href="/driver/login" className="text-amber-400 font-semibold hover:text-amber-300">Sign in</Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.12)' }}>
          Applications are reviewed within 24–48 hours. You will be contacted by email.
        </p>
      </div>
    </div>
  );
}
