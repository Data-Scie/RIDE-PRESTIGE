'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Bus, Car, Star, Users, Van } from 'lucide-react';
import type { FleetCategory } from '@/types';

const GOLD = '#c9a84c';
const BLACK = '#0a0f1e';
const GREY = '#8b8fa8';
const icons: Record<string, ReactNode> = {
  prestige: <Star size={24} />,
  minibus: <Van size={24} />,
  coaches: <Bus size={24} />,
  taxi: <Car size={24} />,
};

export default function VehicleCategoryStrip({
  fleetCategories,
  content = {},
}: {
  fleetCategories: FleetCategory[];
  content?: Record<string, unknown>;
}) {
  return (
    <section className="py-24" style={{background:'#f4f5f8'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{color:GOLD}}>{String(content.eyebrow || 'Our fleet')}</p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4" style={{fontFamily:'Playfair Display,Georgia,serif',color:BLACK}}>
            {String(content.title || 'Choose your vehicle')}
          </h2>
          <p className="text-lg max-w-lg mx-auto leading-relaxed" style={{color:GREY}}>
            {String(content.description || 'Four premium hire options, one booking platform. Whatever the journey, we have the right vehicle.')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {fleetCategories
            .filter(cat => ['prestige','minibus','coaches','taxi'].includes(cat.slug))
            .sort((a,b) => a.order - b.order)
            .map(cat => (
            <div key={cat.id} className="card p-8 group"
              style={{transition:'transform 0.3s, box-shadow 0.3s'}}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300"
                style={{background:'rgba(201,168,76,0.08)'}}>
                <span style={{fontSize:'2rem'}}>{icons[cat.slug]}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Users size={13} style={{color:GOLD}} />
                <span className="text-xs font-medium" style={{color:GREY}}>{cat.tagline}</span>
              </div>

              <h3 className="text-2xl font-semibold mb-2" style={{fontFamily:'Playfair Display,Georgia,serif',color:BLACK}}>{cat.name}</h3>
              <p className="text-sm font-medium mb-4" style={{color:GOLD}}>{cat.tagline}</p>
              <p className="text-sm leading-relaxed mb-6" style={{color:GREY}}>{cat.description}</p>

              <div className="flex flex-wrap gap-2 mb-8">
                {['Professional drivers', '24/7 service', 'Instant quotes'].map(uc => (
                  <span key={uc} className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{background:'#f4f5f8',color:GREY}}>{uc}</span>
                ))}
              </div>

              <Link href={`/book?category=${cat.slug}`}
                className="flex items-center justify-between p-4 rounded-xl transition-all duration-200"
                style={{background:'rgba(10,15,30,0.04)',border:'1px solid transparent'}}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(201,168,76,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(10,15,30,0.04)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}>
                <span className="text-sm font-semibold" style={{color:BLACK}}>Book this vehicle</span>
                <ArrowRight size={16} style={{color:GOLD}} />
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/fleet" className="btn-outline-gold inline-flex items-center gap-2">
            View full fleet details <ArrowRight size={16}/>
          </Link>
        </div>
      </div>
    </section>
  );
}
