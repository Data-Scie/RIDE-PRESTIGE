import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — Ride Prestige',
  description: 'Ride Prestige cancellation and refund policy. Cancel at least 8 hours before your ride for a full refund, processed within 48 hours.',
};

const RULES = [
  {
    title: '1. Cancellation Window',
    content: 'Customers may cancel their booking free of charge provided the cancellation is made at least 8 hours before the scheduled pickup time. Cancellations made less than 8 hours before the ride cannot be accepted and are not eligible for a refund.',
  },
  {
    title: '2. How to Cancel',
    content: 'To cancel, contact us immediately by phone (+44 114 000 0000) or email (bookings@rideprestige.co.uk), quoting your booking reference number. Our team will confirm eligibility based on the 8-hour rule.',
  },
  {
    title: '3. Refund Processing',
    content: 'Approved refunds are processed within 48 hours of cancellation approval. Refunds are returned to the original payment method. Bank processing times may vary (typically 3–5 business days).',
  },
  {
    title: '4. Non-Refundable Situations',
    content: 'No refund is issued for: cancellations less than 8 hours before the ride; no-shows (customer fails to appear at pickup); rides that have commenced; bookings cancelled due to incorrect information provided by the customer.',
  },
  {
    title: '5. Ride Prestige Cancellations',
    content: 'In the unlikely event that Ride Prestige must cancel your booking, you will receive a full refund within 24 hours and we will make every effort to arrange an alternative vehicle.',
  },
  {
    title: '6. Amendments',
    content: 'Booking amendments (change of time, vehicle, or route) may be made up to 8 hours before the ride. Amendments within 8 hours are subject to availability and may incur an administration fee.',
  },
];

export default function RefundPage() {
  return (
    <PublicLayout>
      <div style={{ background:'#000000' }} className="pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:'#c9a84c' }}>Our Policy</p>
          <h1 className="text-4xl font-semibold text-white mb-4" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Refund &amp; Cancellation</h1>
          <p className="text-white/55 text-lg">Please read our cancellation policy carefully before booking.</p>
        </div>
      </div>

      {/* Key rule banner */}
      <div style={{ background:'#c9a84c', padding:'1.5rem' }}>
        <p style={{ textAlign:'center', fontWeight:700, fontSize:'1rem', color:'#000000' }}>
          Key rule: Cancel at least <strong>8 hours before</strong> your ride for a full refund &mdash; processed within <strong>48 hours</strong>
        </p>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          {RULES.map(({ title, content }) => (
            <div key={title} className="card p-8">
              <h2 className="text-xl font-semibold mb-3" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>{title}</h2>
              <p className="text-sm leading-relaxed" style={{ color:'#5f637a' }}>{content}</p>
            </div>
          ))}

          <div className="rounded-2xl p-8 text-center" style={{ background:'#000000' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:'#c9a84c' }}>Summary</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginBottom:'2rem' }}>
              <div>
                <p style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:'2rem', fontWeight:700, color:'#c9a84c' }}>8 hrs</p>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.85rem' }}>Minimum cancellation notice</p>
              </div>
              <div>
                <p style={{ fontFamily:'Playfair Display,Georgia,serif', fontSize:'2rem', fontWeight:700, color:'#c9a84c' }}>48 hrs</p>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.85rem' }}>Refund processing window</p>
              </div>
            </div>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', marginBottom:'1.5rem' }}>
              For cancellations or queries, contact us at bookings@rideprestige.co.uk or call +44 114 000 0000
            </p>
            <Link href="/book" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'0.875rem 2rem', background:'#c9a84c', color:'#000000', borderRadius:'10px', fontWeight:700, fontSize:'0.875rem', textDecoration:'none' }}>
              Book with confidence
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
