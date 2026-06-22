'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { customerApi } from '@/lib/api-client';

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

export default function AccountBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    customerApi.get<{ success: boolean; data: Booking[] }>('/api/customer/bookings')
      .then(result => setBookings(result.data))
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load your bookings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading your bookings...</div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Bookings</h1>
        <p className="text-sm text-slate-500">{bookings.length} total</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      {bookings.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <Calendar size={36} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium mb-4">You haven&apos;t made any bookings yet.</p>
          <Link href="/book" className="btn-gold inline-flex items-center justify-center px-6 py-3">Book a ride</Link>
        </div>
      )}

      <div className="space-y-3">
        {bookings.map(b => (
          <Link key={b.id} href={`/account/bookings/${b.id}`} className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-slate-200 transition-colors">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-sm font-bold text-slate-800">{b.reference}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_STYLE[b.status] ?? 'bg-slate-50 text-slate-600'}`}>{b.status}</span>
                  <span className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-semibold capitalize">{b.vehicleCategory}</span>
                </div>
                <p className="text-sm text-slate-600 flex items-center gap-1.5"><MapPin size={13} /> {b.journey.pickupPostcode} &rarr; {b.journey.dropoffPostcode}</p>
                {b.journey.date && <p className="text-xs text-slate-400 mt-1">{b.journey.date} {b.journey.time} &middot; {b.journey.passengers} passengers</p>}
              </div>
              {b.estimatedFare !== null && <p className="font-bold text-lg text-slate-800">£{b.estimatedFare}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
