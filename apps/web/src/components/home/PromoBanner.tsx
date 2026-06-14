import Link from 'next/link';
import { Tag, ArrowRight } from 'lucide-react';
import { promotions } from '@/lib/data';

const GOLD = '#c9a84c';
const BLACK = '#0a0f1e';
const CHARCOAL = '#1a1f2e';

export default function PromoBanner() {
  const activePromo = promotions.find(p => p.active);
  if (!activePromo) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl p-8 sm:p-10 relative overflow-hidden"
          style={{
            background:`linear-gradient(135deg,${BLACK} 0%,${CHARCOAL} 50%,${BLACK} 100%)`,
            border:'1px solid rgba(201,168,76,0.15)',
          }}>
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-2xl"
            style={{background:'rgba(201,168,76,0.07)'}} />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full blur-xl"
            style={{background:'rgba(201,168,76,0.04)'}} />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.2)'}}>
                <Tag size={24} style={{color:GOLD}} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{color:GOLD}}>
                  Limited Offer
                </p>
                <h3 className="font-semibold text-xl text-white mb-1.5"
                  style={{fontFamily:'Playfair Display,Georgia,serif'}}>
                  {activePromo.title}
                </h3>
                <p className="text-sm" style={{color:'rgba(255,255,255,0.55)'}}>{activePromo.description}</p>
                {activePromo.couponCode && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5"
                    style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)'}}>
                    <span className="text-xs font-medium" style={{color:GOLD}}>Code:</span>
                    <span className="font-mono font-bold text-sm tracking-wider text-white">{activePromo.couponCode}</span>
                  </div>
                )}
              </div>
            </div>

            <Link href="/promotions" className="btn-gold whitespace-nowrap flex items-center gap-2 shrink-0">
              View all offers <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
