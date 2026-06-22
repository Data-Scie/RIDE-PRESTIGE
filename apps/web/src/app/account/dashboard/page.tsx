'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle, Clock, MapPin, Navigation } from 'lucide-react';
import { customerApi } from '@/lib/api-client';

const GOLD = '#c9a84c';
const BRAND_BLACK = '#0a0f1e';

interface Booking {
  id: string;
  reference: string;
  status: string;
  createdAt: string;
  journey: { pickupPostcode: string; dropoffPostcode: string; date?: string; time?: string };
  estimatedFare: number | null;
}

interface Profile { fullName: string; totalBookings: number; }

export default function AccountDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      customerApi.get<{ success: boolean; data: Profile }>('/api/customer/profile'),
      customerApi.get<{ success: boolean; data: Booking[] }>('/api/customer/bookings'),
    ])
      .then(([profileResult, bookingsResult]) => {
        setProfile(profileResult.data);
        setBookings(bookingsResult.data);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load your account'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading your account...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  const active = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
  const completed = bookings.filter(b => b.status === 'completed');
  const recent = bookings.slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className="text-sm font-semibold" style={{ color: GOLD }}>Welcome back</p>
        <h1 className="text-2xl font-bold" style={{ color: BRAND_BLACK }}>{profile?.fullName}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Bookings', value: profile?.totalBookings ?? bookings.length, icon: Calendar, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
          { label: 'Active', value: active.length, icon: Navigation, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg} ${color}`}><Icon size={18} /></div>
            <p className="text-2xl font-bold text-slate-800">{value}</p><p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Bookings</h2>
          <Link href="/account/bookings" className="text-sm font-semibold" style={{ color: GOLD }}>View all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500 font-medium mb-4">You haven&apos;t made any bookings yet.</p>
            <Link href="/book" className="btn-gold inline-flex items-center justify-center px-6 py-3">Book a ride</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map(b => (
              <Link key={b.id} href={`/account/bookings/${b.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-slate-800">{b.reference}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize bg-slate-50 text-slate-600">{b.status}</span>
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-1.5"><MapPin size={12} /> {b.journey.pickupPostcode} &rarr; {b.journey.dropoffPostcode}</p>
                  {b.journey.date && <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1"><Clock size={11} /> {b.journey.date} {b.journey.time}</p>}
                </div>
                {b.estimatedFare !== null && <p className="font-bold text-slate-800">£{b.estimatedFare}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
