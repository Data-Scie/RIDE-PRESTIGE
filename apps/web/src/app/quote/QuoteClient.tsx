'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Bus, Car, CheckCircle, Star, Van, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { QuoteResult, BookingFormData } from '@/types';
import { formatCurrency, getCategoryLabel } from '@/lib/fare';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ICON: Record<string, ReactNode> = {
  prestige: <Star size={20} />,
  minibus:  <Van size={20} />,
  coaches:  <Bus size={20} />,
  taxi:     <Car size={20} />,
};

export default function QuoteClient() {
  const router = useRouter();
  const [quote, setQuote]       = useState<QuoteResult | null>(null);
  const [form, setForm]         = useState<BookingFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    const q = sessionStorage.getItem('rp_quote');
    const f = sessionStorage.getItem('rp_booking_form');
    if (q) setQuote(JSON.parse(q));
    if (f) setForm(JSON.parse(f));
  }, []);

  const handleAccept = async () => {
    if (!form || !quote) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/public/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:        form.fullName,
          phone:           form.phone,
          email:           form.email,
          pickupPostcode:  form.pickupPostcode,
          dropoffPostcode: form.dropoffPostcode,
          vehicleCategory: form.vehicleCategory,
          passengers:      form.passengers,
          bookingType:     form.bookingType,
          date:            form.date || undefined,
          time:            form.time || undefined,
          notes:           form.notes || undefined,
          pickupLatitude:  form.pickupLatitude,
          pickupLongitude: form.pickupLongitude,
          dropoffLatitude: form.dropoffLatitude,
          dropoffLongitude: form.dropoffLongitude,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking failed');

      const ref = data.data?.booking?.reference || quote.bookingRef;
      const paymentUrl: string | undefined = data.data?.payment?.url;

      // Clear session storage
      sessionStorage.removeItem('rp_quote');
      sessionStorage.removeItem('rp_booking_form');

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      setAccepted(true);
      setTimeout(() => router.push(`/thank-you?status=accepted&ref=${encodeURIComponent(ref)}`), 1200);
    } catch (e: unknown) {
      setError((e as Error).message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (!quote) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f4f5f8' }}>
      <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin mb-4" />
      <p style={{ color: '#8b8fa8' }}>Loading your quote…</p>
    </div>
  );

  const { calculation: calc, journey } = quote;

  return (
    <>
      <div style={{ background: '#000000' }} className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p style={{ color: '#c9a84c' }} className="text-sm font-semibold uppercase tracking-widest mb-3">Your quote</p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-3" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>
            Fare estimate ready
          </h1>
          <p className="text-white/50">Ref: <span className="text-white font-mono">{quote.bookingRef}</span></p>
        </div>
      </div>

      <div className="py-16 min-h-screen" style={{ background: '#f4f5f8' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">

          {/* Journey summary */}
          <div className="card p-8">
            <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>Journey summary</h2>
            <div className="flex items-start gap-4 mb-6">
              <div className="flex flex-col items-center gap-1 mt-1">
                <div className="w-3 h-3 rounded-full" style={{ background: '#c9a84c' }} />
                <div className="w-0.5 h-10 bg-gray-200" />
                <div className="w-3 h-3 border-2 border-gray-400 rounded-full" />
              </div>
              <div className="flex flex-col justify-between h-14">
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#0a0f1e' }}>Pickup</p>
                  <p className="text-xs font-mono" style={{ color: '#8b8fa8' }}>{journey.pickupPostcode}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#0a0f1e' }}>Drop-off</p>
                  <p className="text-xs font-mono" style={{ color: '#8b8fa8' }}>{journey.dropoffPostcode}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
              {[
                { label: 'Vehicle', value: (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>{ICON[journey.vehicleCategory]} {getCategoryLabel(journey.vehicleCategory)}</span>) },
                { label: 'Passengers', value: `${journey.passengers}` },
                { label: 'Distance', value: `~${calc.estimatedDistanceMiles} miles` },
                { label: 'Duration', value: `~${Math.round(calc.estimatedHours * 60)} mins` },
                ...(journey.bookingType === 'scheduled' && journey.date ? [{ label: 'Date', value: journey.date }] : []),
                ...(journey.bookingType === 'scheduled' && journey.time ? [{ label: 'Time', value: journey.time }] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#8b8fa8' }}>{label}</p>
                  <p className="font-semibold text-sm" style={{ color: '#0a0f1e' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fare breakdown */}
          <div className="card p-8">
            <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>Fare breakdown</h2>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#0a0f1e' }}>Estimated journey</p>
                  <p className="text-xs" style={{ color: '#8b8fa8' }}>{Math.round(calc.estimatedHours * 60)} mins · ~{calc.estimatedDistanceMiles} miles</p>
                </div>
                <p className="font-semibold" style={{ color: '#0a0f1e' }}>{formatCurrency(calc.total)}</p>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t-2 rounded-xl p-5 -mx-2" style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.03)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#8b8fa8' }}>Total estimate</p>
                  <p className="text-xs italic" style={{ color: 'rgba(139,143,168,0.7)' }}>Confirmed on booking.</p>
                </div>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>{formatCurrency(calc.total)}</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          {!accepted ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleAccept}
                disabled={submitting}
                className="flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait"
                style={{ background: '#000000', color: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
              >
                {submitting
                  ? <><Loader2 size={18} className="animate-spin" /> Confirming booking…</>
                  : <><CheckCircle size={18} /> Accept &amp; Confirm Booking</>
                }
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center justify-center gap-2 py-4 rounded-xl font-semibold border-2 transition-all"
                style={{ borderColor: '#e5e7eb', color: '#8b8fa8' }}
              >
                <ArrowLeft size={18} /> Edit Journey
              </button>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>Booking confirmed!</h3>
              <p style={{ color: '#8b8fa8' }}>Redirecting to your confirmation…</p>
            </div>
          )}

          <div className="rounded-xl px-5 py-4" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
            <p className="text-xs" style={{ color: '#c9a84c', fontWeight: 600 }}>
              Cancellation: Cancel 8+ hours before your ride for a full refund, processed within 48 hours.{' '}
              <a href="/refund" style={{ textDecoration: 'underline' }}>Full policy</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
