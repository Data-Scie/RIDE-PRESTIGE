'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, Navigation } from 'lucide-react';
import { customerApi, getPortalToken } from '@/lib/api-client';

interface Booking {
  id: string;
  reference: string;
  status: string;
  createdAt: string;
  journey: { pickupPostcode: string; dropoffPostcode: string; date?: string; time?: string; passengers: number };
  vehicleCategory: string;
  estimatedFare: number | null;
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
};

export default function MyBookingsClient() {
  const { status: sessionStatus } = useSession();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!getPortalToken('customer')) { setBookings([]); return; }
    customerApi.get<{ success: boolean; data: Booking[] }>('/api/customer/bookings')
      .then(result => setBookings(result.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load your bookings'));
  }, [sessionStatus]);

  if (sessionStatus === 'loading' || bookings === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f5f8' }}>
        <div className="w-10 h-10 border-4 border-t-yellow-600 border-yellow-200 rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionStatus !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center py-24 px-4" style={{ background: '#f4f5f8' }}>
        <div className="max-w-md w-full card p-10 text-center">
          <p className="font-semibold mb-4" style={{ color: '#0a0f1e' }}>Sign in to see your bookings</p>
          <Link href="/login?redirect=/my-bookings" className="btn-gold inline-flex items-center justify-center px-6 py-3">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: '#f4f5f8' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>My Bookings</h1>

        {error && <div className="card p-4 text-sm text-red-600">{error}</div>}

        {bookings.length === 0 && !error && (
          <div className="card p-10 text-center">
            <p className="font-medium mb-4" style={{ color: '#0a0f1e' }}>You haven&apos;t made any bookings yet.</p>
            <Link href="/book" className="btn-gold inline-flex items-center justify-center px-6 py-3">Book a ride</Link>
          </div>
        )}

        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold" style={{ color: '#c9a84c' }}>{b.reference}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_STYLE[b.status] ?? 'bg-slate-50 text-slate-600'}`}>{b.status}</span>
                  </div>
                  <p className="text-sm flex items-center gap-1.5" style={{ color: '#1a1f2e' }}>
                    <MapPin size={13} /> {b.journey.pickupPostcode} &rarr; {b.journey.dropoffPostcode}
                  </p>
                  {b.journey.date && (
                    <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: '#8b8fa8' }}>
                      <Calendar size={12} /> {b.journey.date} {b.journey.time}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {b.estimatedFare !== null && <p className="font-bold" style={{ color: '#0a0f1e' }}>£{b.estimatedFare}</p>}
                  <Link href={`/track/${b.reference}`} className="text-xs font-semibold flex items-center gap-1 mt-2 justify-end" style={{ color: '#c9a84c' }}>
                    <Navigation size={12} /> Track
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
