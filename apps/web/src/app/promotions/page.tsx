export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Tag, ArrowRight, CheckCircle, Calendar } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { getPromotions } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Promotions & Discounts',
  description: 'Exclusive offers on minibus, coach, and prestige vehicle hire. Airport transfer discounts, corporate rates, and seasonal promotions.',
};

export default async function PromotionsPage() {
  const promotions = await getPromotions();
  const active = promotions.filter(p => p.active);

  return (
    <PublicLayout>
      <div className="bg-brand-black pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-brand-gold text-sm font-semibold uppercase tracking-widest mb-3">Exclusive offers</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-4">
            Promotions & discounts
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Premium transport at exceptional value. Apply your code at checkout.
          </p>
        </div>
      </div>

      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Active promotions grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {active.map(promo => (
              <div key={promo.id} className="card p-8 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gold-gradient" />

                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center group-hover:bg-brand-gold/20 transition-colors">
                    <Tag size={20} className="text-brand-gold" />
                  </div>
                  <div className="text-right">
                    <span className="font-display text-3xl font-bold text-brand-black">
                      {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `£${promo.discountValue}`}
                    </span>
                    <p className="text-xs text-brand-grey">off</p>
                  </div>
                </div>

                <h3 className="font-display text-xl font-semibold text-brand-black mb-2">{promo.title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed mb-5">{promo.description}</p>

                {promo.couponCode && (
                  <div className="flex items-center gap-3 mb-5 p-3 bg-brand-grey-pale rounded-xl">
                    <span className="text-xs text-brand-grey font-medium uppercase tracking-wide">Code:</span>
                    <span className="font-mono font-bold text-brand-black tracking-wider">{promo.couponCode}</span>
                    <button
                      // clipboard copy requires client component
                      className="ml-auto text-xs text-brand-gold hover:underline font-medium"
                    >
                      Copy
                    </button>
                  </div>
                )}

                {(promo.startDate || promo.endDate) && (
                  <div className="flex items-center gap-2 text-xs text-brand-grey mb-5">
                    <Calendar size={12} />
                    <span>Valid until {new Date(promo.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}

                <details className="mb-5 text-xs text-brand-grey/70">
                  <summary className="cursor-pointer text-brand-grey font-medium mb-2">Terms & conditions</summary>
                  <p className="leading-relaxed mt-2">{promo.terms}</p>
                </details>

                <Link href="/book" className="flex items-center justify-between p-3 rounded-xl bg-brand-black/4 hover:bg-brand-gold/8 border border-transparent hover:border-brand-gold/20 transition-all group/link">
                  <span className="text-sm font-semibold text-brand-black">Book now</span>
                  <ArrowRight size={15} className="text-brand-gold group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
            {active.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-gray-200 bg-brand-grey-pale px-6 py-14 text-center">
                <Tag size={30} className="mx-auto mb-3 text-brand-grey" />
                <h2 className="font-display text-2xl font-semibold text-brand-black">No active promotions</h2>
                <p className="mt-2 text-sm text-brand-grey">New offers will appear here when they are published.</p>
              </div>
            )}
          </div>

          {/* Corporate section */}
          <div className="bg-brand-black rounded-3xl p-10 sm:p-14 relative overflow-hidden mb-16">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-gold/5 rounded-full blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-brand-gold text-xs font-semibold uppercase tracking-widest mb-4">Corporate accounts</p>
                <h2 className="font-display text-3xl font-semibold text-white mb-4">
                  Travel more, spend less.
                </h2>
                <p className="text-white/60 leading-relaxed mb-6">
                  Corporate account holders enjoy preferential rates, priority booking, monthly invoicing, and a dedicated account manager.
                </p>
                {['Priority booking & 24/7 support', 'Monthly consolidated invoicing', 'Dedicated account manager', 'Flexible payment terms'].map(f => (
                  <div key={f} className="flex items-center gap-2.5 mb-2.5">
                    <CheckCircle size={15} className="text-brand-gold shrink-0" />
                    <span className="text-white/75 text-sm">{f}</span>
                  </div>
                ))}
              </div>
              <div className="lg:text-right">
                <Link href="/contact" className="btn-gold inline-flex items-center gap-2 text-base px-8 py-4">
                  Set up corporate account
                  <ArrowRight size={18} />
                </Link>
                <p className="text-white/40 text-xs mt-4">Free to set up. No monthly fees.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
