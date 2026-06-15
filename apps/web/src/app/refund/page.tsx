import type { Metadata } from 'next';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { getCancellation, getContact } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy - Ride Prestige',
  description: 'Ride Prestige cancellation and refund policy.',
};

export default async function RefundPage() {
  const [policy, contact] = await Promise.all([getCancellation(), getContact()]);
  const rules = [
    {
      title: '1. Cancellation Window',
      content: `Customers may cancel free of charge at least ${policy.minHoursBeforeRide} hours before the scheduled pickup. Later cancellations are not eligible for a refund.`,
    },
    {
      title: '2. How to Cancel',
      content: `Contact us by phone (${contact.phoneNumber}) or email (${contact.contactEmail}) and quote your booking reference.`,
    },
    {
      title: '3. Refund Processing',
      content: `Approved refunds are processed within ${policy.refundWindowHours} hours of approval and returned to the original payment method.`,
    },
    {
      title: '4. Policy Summary',
      content: policy.message,
    },
    {
      title: '5. Non-Refundable Situations',
      content: `No refund is issued for cancellations within ${policy.minHoursBeforeRide} hours, no-shows, rides that have commenced, or bookings affected by incorrect customer information.`,
    },
  ];

  return (
    <PublicLayout>
      <div className="pt-20 pb-16" style={{ background: '#000000' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#c9a84c' }}>Our Policy</p>
          <h1 className="text-4xl font-semibold text-white mb-4" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Refund &amp; Cancellation</h1>
          <p className="text-white/55 text-lg">Please read our cancellation policy carefully before booking.</p>
        </div>
      </div>

      <div style={{ background: '#c9a84c', padding: '1.5rem' }}>
        <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: '#000000' }}>
          Cancel at least <strong>{policy.minHoursBeforeRide} hours before</strong> your ride. Approved refunds are processed within <strong>{policy.refundWindowHours} hours</strong>.
        </p>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          {rules.map(({ title, content }) => (
            <div key={title} className="card p-8">
              <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>{title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#5f637a' }}>{content}</p>
            </div>
          ))}

          <div className="rounded-2xl p-8 text-center" style={{ background: '#000000' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#c9a84c' }}>Need help?</p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {contact.contactEmail} | {contact.phoneNumber}
            </p>
            <Link href="/book" className="btn-gold">Book with confidence</Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
