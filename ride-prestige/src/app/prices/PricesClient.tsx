'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Users, CheckCircle, Clock, MapPin, Bus, Car, Van, Star } from 'lucide-react';
import { calculateFareForCategory, formatCurrency } from '@/lib/fare';
import { estimateDistance } from '@/lib/distance';
import type { VehicleCategory } from '@/types';

const GOLD = '#c9a84c';
const BLACK = '#000000';

const VEHICLES: { value: VehicleCategory; label: string; icon: ReactNode; capacity: string; description: string; features: string[]; tag?: string }[] = [
  { value:'prestige', label:'Prestige', icon:<Star size={26} />, capacity:'3–4 persons', description:'Luxury executive cars for VIP travel, airport transfers and business journeys.', features:['Leather interior','Professional chauffeur','Premium comfort','Airport meet & greet'] },
  { value:'minibus',  label:'Minibus', icon:<Van size={26} />, capacity:'6–16 persons', description:'Modern minibuses for airport transfers, group day trips, and private events. Comfortable and spacious.', features:['Air conditioning','Luggage space','USB charging','Professional driver'] },
  { value:'coaches',  label:'Coach',   icon:<Bus size={26} />, capacity:'20–70 persons', description:'Full-size coaches for large groups, corporate events, school trips, and long-distance travel across the UK.', features:['Reclining seats','Onboard toilet','Luggage bay','PA system'] },
  { value:'taxi',     label:'Taxi',    icon:<Car size={26} />, capacity:'1–4 persons', description:'Reliable saloon taxis for everyday journeys and fast local transfers.', features:['Card payments','GPS navigation','Licensed driver','Quick pickup'] },
];

export default function PricesClient() {
  const router = useRouter();
  const params = useSearchParams();

  const pickup = params.get('pickup') || '';
  const dropoff = params.get('dropoff') || '';
  const passengers = parseInt(params.get('passengers') || '2');
  const bookingType = params.get('bookingType') || 'current';
  const date = params.get('date') || '';
  const time = params.get('time') || '';

  const [distance, setDistance] = useState<{ distanceMiles:number; durationHours:number } | null>(null);
  const [selected, setSelected] = useState<VehicleCategory | null>(null);

  useEffect(() => {
    if (pickup && dropoff) {
      estimateDistance(pickup, dropoff).then(r => setDistance({ distanceMiles:r.distanceMiles, durationHours:r.durationHours }));
    }
  }, [pickup, dropoff]);

  const handleSelect = (category: VehicleCategory) => {
    setSelected(category);
    const bookParams = new URLSearchParams({
      pickup, dropoff, passengers:String(passengers), bookingType, category,
      ...(date?{date}:{}), ...(time?{time}:{}),
    });
    setTimeout(() => {
      window.location.href = '/login?' + new URLSearchParams({ redirect:'/book?'+bookParams.toString() }).toString();
    }, 300);
  };

  return (
    <>
      <div style={{ background:BLACK }} className="pt-20 pb-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <button type="button" onClick={() => router.back()}
            className="flex items-center gap-2 mb-8 text-sm transition-opacity hover:opacity-70"
            style={{ color:'rgba(255,255,255,0.45)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:GOLD }}>Fare estimates</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-6" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>
            Choose your vehicle
          </h1>
          <div className="inline-flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4"
            style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <MapPin size={13} style={{ color:GOLD }} />
              <span className="text-sm text-white font-mono">{pickup || '—'}</span>
            </div>
            <span style={{ color:'rgba(255,255,255,0.2)' }}>→</span>
            <div className="flex items-center gap-2">
              <MapPin size={13} style={{ color:'rgba(255,255,255,0.3)' }} />
              <span className="text-sm text-white font-mono">{dropoff || '—'}</span>
            </div>
            <span style={{ color:'rgba(255,255,255,0.15)' }}>|</span>
            <div className="flex items-center gap-2">
              <Users size={13} style={{ color:'rgba(255,255,255,0.45)' }} />
              <span className="text-sm" style={{ color:'rgba(255,255,255,0.6)' }}>{passengers} {passengers===1?'person':'persons'}</span>
            </div>
            {distance && (
              <>
                <span style={{ color:'rgba(255,255,255,0.15)' }}>|</span>
                <div className="flex items-center gap-2">
                  <Clock size={13} style={{ color:'rgba(255,255,255,0.45)' }} />
                  <span className="text-sm" style={{ color:'rgba(255,255,255,0.6)' }}>
                    ~{Math.round(distance.durationHours * 60)} min &middot; {distance.distanceMiles} mi
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="py-14" style={{ background:'#f4f5f8', minHeight:'60vh' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {!distance ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin" />
              <p style={{ color:'#8b8fa8' }}>Calculating your fares&hellip;</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {VEHICLES.map(v => {
                const fare = calculateFareForCategory(v.value, distance.distanceMiles, distance.durationHours, passengers);
                const isSel = selected === v.value;
                return (
                  <div key={v.value} className="relative rounded-2xl overflow-hidden flex flex-col transition-all duration-200"
                    style={{ background:'white', boxShadow:isSel?'0 8px 40px rgba(201,168,76,0.3)':'0 2px 20px rgba(0,0,0,0.08)', border:isSel?`2px solid ${GOLD}`:'2px solid transparent', transform:isSel?'translateY(-4px)':'none' }}>
                    {v.tag && (
                      <div className="absolute top-4 right-4 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background:`rgba(201,168,76,0.12)`, color:GOLD }}>{v.tag}</div>
                    )}
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-brand-black" style={{ background:'#f4f5f8' }}>{v.icon}</div>
                        <div>
                          <h3 className="font-semibold text-sm" style={{ fontFamily:'Playfair Display,Georgia,serif', color:BLACK }}>{v.label}</h3>
                          <p className="text-xs mt-0.5" style={{ color:'#8b8fa8' }}>{v.capacity}</p>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed mb-4" style={{ color:'#5f637a' }}>{v.description}</p>
                      <div className="space-y-1.5 mb-4">
                        {v.features.map(f => (
                          <div key={f} className="flex items-center gap-2">
                            <CheckCircle size={11} style={{ color:GOLD, flexShrink:0 }} />
                            <span className="text-xs" style={{ color:'#6b7280' }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-6 pb-6">
                      <div className="rounded-xl p-4 mb-3" style={{ background:'#f8f9fb', border:'1px solid #e8eaef' }}>
                        <p className="text-xs uppercase tracking-wider mb-1" style={{ color:'#8b8fa8' }}>Est. fare</p>
                        <p className="font-bold" style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:'1.75rem', color:BLACK, lineHeight:1 }}>
                          {formatCurrency(fare.total)}
                        </p>
                        <p className="text-xs mt-1" style={{ color:'#b0b4c4' }}>{distance.distanceMiles} mi &middot; ~{Math.round(distance.durationHours*60)} min</p>
                      </div>
                      <button type="button" onClick={() => handleSelect(v.value)} disabled={!!selected}
                        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                        style={{ background:isSel?'linear-gradient(135deg,#c9a84c,#e8c96d,#a07c30)':BLACK, color:isSel?BLACK:'white', cursor:selected?'default':'pointer', border:'none', fontFamily:'inherit' }}>
                        {isSel ? 'Selected ✓' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-center text-xs mt-8" style={{ color:'#b0b4c4' }}>
            Estimates based on demo distance. Final fare confirmed on booking based on actual route.
          </p>
        </div>
      </div>
    </>
  );
}
