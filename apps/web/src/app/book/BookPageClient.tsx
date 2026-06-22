'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, Bus, Car, MapPin, Star, Van } from 'lucide-react';
import type { BookingFormData, VehicleCategory, BookingType } from '@/types';
import { generateQuote } from '@/lib/fare';
import { customerApi, getPortalToken } from '@/lib/api-client';

const VEHICLES: { value: VehicleCategory; label: string; icon: ReactNode; desc: string }[] = [
  { value:'prestige', label:'Prestige', icon:<Star size={24} />, desc:'Luxury cars and executive vehicles' },
  { value:'minibus', label:'Minibus', icon:<Van size={24} />, desc:'6–16 persons' },
  { value:'coaches', label:'Coach',   icon:<Bus size={24} />, desc:'20–70 persons' },
  { value:'taxi',    label:'Taxi',    icon:<Car size={24} />, desc:'Saloon taxi for up to 4 passengers' },
];

function pl(n: number) { return n === 1 ? '1 person' : `${n} persons`; }

interface BookPageClientProps {
  intro?: { title: string; description: string };
}

export default function BookPageClient({ intro }: BookPageClientProps) {
  const router = useRouter();
  const params = useSearchParams();
  const { status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [minDate, setMinDate] = useState('');

  useEffect(() => { setMinDate(new Date().toISOString().split('T')[0]); }, []);

  const [form, setForm] = useState<BookingFormData>({
    fullName: '', phone: '', email: '',
    pickupPostcode: params.get('pickup') || '',
    dropoffPostcode: params.get('dropoff') || '',
    bookingType: (params.get('bookingType') as BookingType) || 'current',
    date: params.get('date') || '',
    time: params.get('time') || '',
    passengers: parseInt(params.get('passengers') || '2'),
    notes: '',
    vehicleCategory: (params.get('category') as VehicleCategory) || 'minibus',
    vehicleId: params.get('vehicleId') || undefined,
  });

  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !getPortalToken('customer')) return;
    customerApi.get<{ success: boolean; data: { fullName: string; email: string; phone: string | null } }>('/api/customer/profile')
      .then(result => {
        setForm(prev => ({
          ...prev,
          fullName: prev.fullName || result.data.fullName,
          email: prev.email || result.data.email,
          phone: prev.phone || result.data.phone || '',
        }));
      })
      .catch(() => {});
  }, [sessionStatus]);

  const set = (k: keyof BookingFormData, v: unknown) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const e = { ...p }; delete e[k]; return e; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName?.trim()) e.fullName = 'Required';
    if (!form.phone?.trim()) e.phone = 'Required';
    if (!form.email?.trim()) e.email = 'Required';
    if (!form.pickupPostcode?.trim()) e.pickupPostcode = 'Required';
    if (!form.dropoffPostcode?.trim()) e.dropoffPostcode = 'Required';
    if (form.bookingType === 'scheduled') {
      if (!form.date) e.date = 'Required';
      if (!form.time) e.time = 'Required';
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const quote = await generateQuote(form);
      sessionStorage.setItem('rp_quote', JSON.stringify(quote));
      sessionStorage.setItem('rp_booking_form', JSON.stringify(form));
      router.push('/quote');
    } catch { setLoading(false); }
  };

  return (
    <>
      <div style={{ background:'#000000' }} className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p style={{ color:'#c9a84c' }} className="text-sm font-semibold uppercase tracking-widest mb-3">Book your journey</p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-4" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>{intro?.title || 'Complete your booking'}</h1>
          <p className="text-white/55 text-lg max-w-xl mx-auto">{intro?.description || 'Enter your details to receive an instant fare estimate.'}</p>
        </div>
      </div>

      <div className="py-16 min-h-screen" style={{ background:'#f4f5f8' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">

          {/* Customer details */}
          <div className="card p-8">
            <h2 className="text-xl font-semibold mb-6" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>Your details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Full Name *</label>
                <input type="text" placeholder="e.g. James Hartley" value={form.fullName||''} onChange={e=>set('fullName',e.target.value)}
                  className={`input-field ${errors.fullName?'border-red-400':''}`} />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="label">Phone *</label>
                <input type="tel" placeholder="+44 7700 900100" value={form.phone||''} onChange={e=>set('phone',e.target.value)}
                  className={`input-field ${errors.phone?'border-red-400':''}`} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" placeholder="you@example.com" value={form.email||''} onChange={e=>set('email',e.target.value)}
                  className={`input-field ${errors.email?'border-red-400':''}`} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Journey details */}
          <div className="card p-8">
            <h2 className="text-xl font-semibold mb-6" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>Journey details</h2>
            <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background:'#f4f5f8' }}>
              {[{value:'current' as BookingType,label:'Now'},{value:'scheduled' as BookingType,label:'Schedule'}].map(({value,label})=>(
                <button key={value} type="button" onClick={()=>set('bookingType',value)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${form.bookingType===value?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Pickup postcode *</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'#c9a84c'}} />
                  <input type="text" placeholder="e.g. S1 1AX" value={form.pickupPostcode}
                    onChange={e=>set('pickupPostcode',e.target.value.toUpperCase())}
                    style={{paddingLeft:'2.25rem'}}
                    className={`input-field ${errors.pickupPostcode?'border-red-400':''}`} />
                </div>
                {errors.pickupPostcode && <p className="text-red-500 text-xs mt-1">{errors.pickupPostcode}</p>}
              </div>
              <div>
                <label className="label">Drop-off postcode *</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="text" placeholder="e.g. M1 1AB" value={form.dropoffPostcode}
                    onChange={e=>set('dropoffPostcode',e.target.value.toUpperCase())}
                    style={{paddingLeft:'2.25rem'}}
                    className={`input-field ${errors.dropoffPostcode?'border-red-400':''}`} />
                </div>
                {errors.dropoffPostcode && <p className="text-red-500 text-xs mt-1">{errors.dropoffPostcode}</p>}
              </div>
              {form.bookingType==='scheduled'&&(<>
                <div>
                  <label className="label">Date *</label>
                  <input type="date" value={form.date||''} min={minDate} onChange={e=>set('date',e.target.value)}
                    className={`input-field ${errors.date?'border-red-400':''}`} />
                  {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>
                <div>
                  <label className="label">Time *</label>
                  <input type="time" value={form.time||''} onChange={e=>set('time',e.target.value)}
                    className={`input-field ${errors.time?'border-red-400':''}`} />
                  {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                </div>
              </>)}
              <div>
                <label className="label">Passengers</label>
                <select value={form.passengers} onChange={e=>set('passengers',parseInt(e.target.value))} className="input-field">
                  {Array.from({length:70},(_,i)=>i+1).map(n=><option key={n} value={n}>{pl(n)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input type="text" placeholder="e.g. Meet & greet, wheelchair" value={form.notes||''} onChange={e=>set('notes',e.target.value)} className="input-field" />
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="card p-8">
            <h2 className="text-xl font-semibold mb-6" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>Vehicle category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {VEHICLES.map(opt=>(
                <button key={opt.value} type="button" onClick={()=>set('vehicleCategory',opt.value)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                  style={{ borderColor:form.vehicleCategory===opt.value?'#c9a84c':'#e5e7eb', background:form.vehicleCategory===opt.value?'rgba(201,168,76,0.05)':'white', boxShadow:form.vehicleCategory===opt.value?'0 4px 24px rgba(201,168,76,0.2)':'none' }}>
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-sm font-semibold" style={{color:'#0a0f1e'}}>{opt.label}</span>
                  <span className="text-xs" style={{color:'#8b8fa8'}}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleSubmit} disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2 text-base py-4 disabled:opacity-60">
            {loading?(<span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-yellow-800/30 border-t-yellow-900 rounded-full animate-spin"/>Generating quote…</span>):(<>Get My Quote <ArrowRight size={18}/></>)}
          </button>

          <p className="text-center text-xs" style={{color:'#8b8fa8'}}>
            Cancel 8+ hours before your ride for a full refund.{' '}
            <a href="/refund" style={{color:'#c9a84c'}}>Cancellation policy &rarr;</a>
          </p>
        </div>
      </div>
    </>
  );
}
