'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Bus, Car, CheckCircle, Star, Users, Van } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import type { VehicleCategory, Vehicle, FleetCategory } from '@/types';

type CategorySlug = VehicleCategory | 'all';
const PUBLIC_CATEGORIES: VehicleCategory[] = ['prestige','minibus','coaches','taxi'];

const CATEGORY_COLORS: Record<VehicleCategory, { bg: string; accent: string }> = {
  prestige: { bg: 'linear-gradient(135deg,#1a1000,#0a0a0a)', accent: '#c9a84c' },
  minibus:  { bg: 'linear-gradient(135deg,#001a2a,#0a0a0a)', accent: '#60a5fa' },
  coaches:  { bg: 'linear-gradient(135deg,#001a0a,#0a0a0a)', accent: '#4ade80' },
  taxi:     { bg: 'linear-gradient(135deg,#1a1500,#0a0a0a)', accent: '#fbbf24' },
};

const CATEGORY_ICONS: Record<VehicleCategory, ReactNode> = {
  prestige: <Star size={16} />,
  minibus:  <Van size={16} />,
  coaches:  <Bus size={16} />, 
  taxi:     <Car size={16} />,
};

function VehicleCard({ v }: { v: Vehicle }) {
  const col = CATEGORY_COLORS[v.categorySlug];
  return (
    <div className="transition-transform duration-300 ease-out hover:-translate-y-2 hover:shadow-xl" style={{ background:'#ffffff', borderRadius:'20px', overflow:'hidden', boxShadow:'0 2px 24px rgba(0,0,0,0.08)', border:'1px solid #f0f0f0', display:'flex', flexDirection:'column' }}>
      <div style={{ height:'200px', position:'relative', overflow:'hidden', background: col.bg }}>
        {v.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.imageUrl} alt={v.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} loading="lazy" />
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:'3rem', color: col.accent }}>{CATEGORY_ICONS[v.categorySlug] || <Car size={40} />}</span>
            <p style={{ fontFamily:'Playfair Display,Georgia,serif', color: col.accent, fontSize:'0.9rem', fontWeight:600, marginTop:'0.5rem' }}>{v.name}</p>
          </div>
        )}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'65px', background:'linear-gradient(to top,rgba(0,0,0,0.75),rgba(0,0,0,0.3))' }} />
        <p style={{ position:'absolute', bottom:'12px', left:'14px', fontFamily:'Playfair Display,Georgia,serif', color:'#ffffff', fontSize:'1.05rem', fontWeight:700, margin:0, zIndex:5 }}>{v.name}</p>
        {v.badge && (
          <div style={{ position:'absolute', top:'10px', right:'10px', background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', border:`1px solid ${col.accent}66`, borderRadius:'9999px', padding:'0.2rem 0.75rem' }}>
            <span style={{ color: col.accent, fontSize:'0.62rem', fontWeight:700 }}>{v.badge}</span>
          </div>
        )}
      </div>
      <div style={{ padding:'1.4rem', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.625rem' }}>
          <span style={{ display:'flex', alignItems:'center', gap:'4px', color:'#6b7280', fontSize:'0.78rem' }}>
            <Users size={12} /> {v.passengers} persons
          </span>
          {v.luggage && <span style={{ color:'#9ca3af', fontSize:'0.78rem' }}>&bull; {v.luggage}</span>}
        </div>
        <p style={{ color:'#5f637a', fontSize:'0.83rem', lineHeight:1.65, marginBottom:'1rem', flex:1 }}>{v.description}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.35rem', marginBottom:'1.1rem' }}>
          {v.features.slice(0,4).map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <CheckCircle size={10} style={{ color: col.accent, flexShrink:0 }} />
              <span style={{ fontSize:'0.7rem', color:'#6b7280' }}>{f}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'1rem', borderTop:'1px solid #f0f0f0' }}>
          <span style={{ fontSize:'0.72rem', color:'#9ca3af' }}>Instant quote available</span>
          <Link href={`/book?category=${v.categorySlug}&vehicleId=${v.id}`}
            style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'0.5rem 1rem', background:'#000000', color:'#ffffff', borderRadius:'8px', fontSize:'0.78rem', fontWeight:600, textDecoration:'none' }}>
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FleetClient({ vehicles, fleetCategories }: { vehicles: Vehicle[]; fleetCategories: FleetCategory[] }) {
  const [active, setActive] = useState<CategorySlug>('all');
  const [showHelpPopup, setShowHelpPopup] = useState(false);

  const catOrder = Object.fromEntries(fleetCategories.map(c => [c.slug, c.order]));

  const filtered = (active === 'all'
    ? vehicles.filter(v => v.available && PUBLIC_CATEGORIES.includes(v.categorySlug))
    : vehicles.filter(v => v.categorySlug === active && v.available)
  ).sort((a, b) => (catOrder[a.categorySlug] ?? 99) - (catOrder[b.categorySlug] ?? 99));

  const tabs: { slug: CategorySlug; name: string; icon: ReactNode; count: number }[] = [
    { slug: 'all', name: 'All Vehicles', icon: <Car size={14} />, count: vehicles.filter(v => v.available && PUBLIC_CATEGORIES.includes(v.categorySlug)).length },
    ...fleetCategories
      .filter(c => PUBLIC_CATEGORIES.includes(c.slug))
      .sort((a, b) => a.order - b.order)
      .map(c => ({
        slug: c.slug as CategorySlug, name: c.name, icon: CATEGORY_ICONS[c.slug as VehicleCategory],
        count: vehicles.filter(v => v.categorySlug === c.slug && v.available).length,
      })),
  ];

  return (
    <PublicLayout>
      <div style={{ background:'#000000' }} className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p style={{ color:'#c9a84c' }} className="text-xs font-semibold uppercase tracking-widest mb-3">Our Fleet</p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-4" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>
            The right vehicle for every journey
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
        <div className="card p-6 border border-gray-100 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color:'#c9a84c' }}>Executive support</p>
              <h2 className="text-2xl font-semibold text-brand-black">Need tailored corporate transport?</h2>
              <p className="text-sm leading-relaxed mt-2 text-brand-grey max-w-2xl">
                Our concierge team can arrange prestige vehicles, executive coaches, airport meet & greet, and bespoke group travel with premium support.
              </p>
            </div>
            <button type="button" onClick={() => setShowHelpPopup(true)}
              className="btn-gold">
              Contact our team
            </button>
          </div>
        </div>
      </div>

      <div style={{ background:'#ffffff', borderBottom:'1px solid #f0f0f0', position:'sticky', top:'64px', zIndex:40 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div style={{ display:'flex', gap:'0.35rem', overflowX:'auto', padding:'0.75rem 0' }}>
            {tabs.map(({ slug, name, icon, count }) => {
              const on = active === slug;
              return (
                <button key={slug} type="button" onClick={() => setActive(slug)}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'0.45rem 1rem', borderRadius:'9999px', fontSize:'0.8rem', fontWeight: on ? 700 : 400, color: on ? '#ffffff' : '#6b7280', background: on ? '#000000' : 'transparent', border: on ? 'none' : '1px solid #e5e7eb', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', outline:'none', transition:'all 0.15s' }}>
                  {icon} {name} <span style={{ opacity:0.55 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ background:'#f8f9fb', padding:'3rem 0 5rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {active !== 'all' && (() => {
            const cat = fleetCategories.find(c => c.slug === active);
            if (!cat) return null;
            const col = CATEGORY_COLORS[active as VehicleCategory];
            if (active === 'taxi') {
              return (
                <div style={{ marginBottom:'2.5rem', borderRadius:'20px', overflow:'hidden', position:'relative', height:'380px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1654763001002-8682811a5604?fm=jpg&q=80&w=1600&auto=format&fit=crop&h=380" alt="White taxi" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)' }} />
                  <div style={{ position:'absolute', bottom:'2rem', left:'2rem' }}>
                    <h2 style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#fbbf24', fontSize:'2rem', fontWeight:600, marginBottom:'6px' }}>{cat.name}</h2>
                    <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.9rem', maxWidth:'520px' }}>{cat.description}</p>
                  </div>
                </div>
              );
            }
            return (
              <div style={{ marginBottom:'2.5rem', padding:'1.75rem 2rem', background:'#000000', borderRadius:'20px', display:'flex', alignItems:'center', gap:'1.25rem', flexWrap:'wrap' }}>
                <span style={{ fontSize:'2.25rem' }}>{CATEGORY_ICONS[active as VehicleCategory]}</span>
                <div>
                  <h2 style={{ fontFamily:'Playfair Display,Georgia,serif', color: col.accent, fontSize:'1.5rem', fontWeight:600, marginBottom:'3px' }}>{cat.name}</h2>
                  <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.85rem' }}>{cat.description}</p>
                </div>
              </div>
            );
          })()}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.5rem' }}>
            {filtered.map(v => <VehicleCard key={v.id} v={v} />)}
          </div>
          {filtered.length === 0 && (
            <p style={{ textAlign:'center', color:'#9ca3af', padding:'5rem 0' }}>No vehicles available in this category.</p>
          )}
        </div>
      </div>

      <div style={{ background:'#000000', padding:'5rem 0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p style={{ color:'#c9a84c', fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:'1rem', textAlign:'center' }}>Tailored group transport</p>
          <h2 style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:'2rem', fontWeight:600, color:'#ffffff', marginBottom:'1.5rem', textAlign:'center' }}>Bespoke coach and minibus quotes</h2>
          <p style={{ color:'rgba(255,255,255,0.65)', maxWidth:'52rem', margin:'0 auto 2.5rem', textAlign:'center', lineHeight:1.8 }}>
            We create every quote around your journey, passenger count and itinerary. No public rates, no hidden fees — just a professional estimate for your group travel requirements.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'1.25rem' }}>
            {[
              { title:'Airport transfers', subtitle:'Seamless collection and drop-off for all group sizes.' },
              { title:'Event transport', subtitle:'Reliable coaches and minibuses for conferences, weddings, and sports.' },
              { title:'Corporate travel', subtitle:'Executive group logistics with professional drivers.' },
              { title:'School & tour groups', subtitle:'Safe, comfortable travel for large groups and tours.' },
            ].map(item => (
              <div key={item.title} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'1.25rem' }}>
                <p style={{ color:'#c9a84c', fontSize:'0.85rem', fontWeight:600, marginBottom:'0.75rem' }}>{item.title}</p>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.85rem', lineHeight:1.7 }}>{item.subtitle}</p>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginTop:'2.5rem' }}>
            <Link href="/book" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'0.875rem 2.25rem', background:'#c9a84c', color:'#000000', borderRadius:'12px', fontWeight:700, fontSize:'0.9rem', textDecoration:'none' }}>
              Request a quote
            </Link>
          </div>
        </div>
      </div>

      {showHelpPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowHelpPopup(false)}>
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color:'#c9a84c' }}>Corporate concierge</p>
                <h3 className="text-3xl font-semibold text-brand-black" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Luxury transfer support</h3>
              </div>
              <button type="button" onClick={() => setShowHelpPopup(false)} className="text-sm font-semibold text-brand-grey hover:text-brand-black transition-colors">Close</button>
            </div>
            <p className="text-sm leading-relaxed text-brand-grey mb-6">
              Our dedicated commercial transport team delivers executive vehicles, corporate coach hire, and premium airport transfer services with a discreet, professional finish.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-100 p-5 bg-slate-50">
                <p className="text-xs uppercase tracking-[0.3em] mb-2 text-brand-gold">What we offer</p>
                <ul className="space-y-2 text-sm text-brand-grey">
                  <li>Executive chauffeur service</li>
                  <li>VIP airport meet & greet</li>
                  <li>Custom group travel itineraries</li>
                  <li>Quote and booking support</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-100 p-5 bg-slate-50">
                <p className="text-xs uppercase tracking-[0.3em] mb-2 text-brand-gold">Ready to book?</p>
                <p className="text-sm text-brand-grey mb-5">Click below to start your request and our team will follow up with the right vehicle options.</p>
                <Link href="/contact" className="btn-gold">Request corporate support</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
