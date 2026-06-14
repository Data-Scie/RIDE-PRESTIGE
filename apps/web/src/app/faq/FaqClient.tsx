'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import type { FAQItem } from '@/types';

export default function FaqClient({ faqs }: { faqs: FAQItem[] }) {
  const active_faqs = faqs.filter(f => f.active);
  const categories = [...new Set(active_faqs.map(f => f.category))];

  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = active_faqs.filter(f => f.category === activeCategory).sort((a, b) => a.order - b.order);

  return (
    <PublicLayout>
      <div className="bg-brand-black pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-brand-gold text-sm font-semibold uppercase tracking-widest mb-3">Help centre</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-4">
            Frequently asked questions
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Everything you need to know about booking with Ride Prestige.
          </p>
        </div>
      </div>

      <div className="py-16 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-gray-100">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setOpenId(null); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-brand-black text-white shadow-sm'
                    : 'bg-brand-grey-pale text-brand-grey hover:text-brand-black hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map(item => (
              <div
                key={item.id}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                  openId === item.id ? 'border-brand-gold/30 shadow-gold' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <button
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <span className="font-medium text-brand-black pr-4">{item.question}</span>
                  {openId === item.id
                    ? <ChevronUp size={18} className="text-brand-gold shrink-0" />
                    : <ChevronDown size={18} className="text-brand-grey shrink-0" />
                  }
                </button>
                {openId === item.id && (
                  <div className="px-6 pb-6">
                    <p className="text-brand-grey text-sm leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 bg-brand-grey-pale rounded-2xl p-8 text-center">
            <h3 className="font-display text-xl font-semibold text-brand-black mb-3">Still have questions?</h3>
            <p className="text-brand-grey text-sm mb-6">
              Our team is here to help. Reach out and we&apos;ll get back to you quickly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/contact" className="btn-dark flex items-center gap-2">
                Contact us <ArrowRight size={15} />
              </Link>
              <Link href="/book" className="btn-outline-gold">
                Book a journey
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
