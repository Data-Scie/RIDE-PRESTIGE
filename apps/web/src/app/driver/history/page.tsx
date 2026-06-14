'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, MapPin, Route, Users } from 'lucide-react';
import { driverApi } from '@/lib/api-client';
import StarRating from '@/components/common/StarRating';

interface Job {
  id: string;
  bookingRef: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  fareAmount: number;
  driverPayoutAmount?: number;
  distance?: string;
  passengerCount: number;
  customerName: string;
  dateTime: string;
  completedAt?: string;
  customerRating?: number | null;
  customerFeedback?: string | null;
}

export default function DriverHistoryPage() {
  const [rides, setRides] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    driverApi.get<{ success: boolean; data: Job[] }>('/api/driver/jobs/history')
      .then(result => setRides(result.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading ride history...</div>;
  const total = rides.reduce((sum, ride) => sum + (ride.driverPayoutAmount ?? ride.fareAmount), 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-800">Ride History</h1><p className="text-sm text-slate-500">Completed and cancelled assignments</p></div><div className="text-right"><p className="text-2xl font-bold text-slate-800">£{total.toFixed(2)}</p><p className="text-xs text-slate-400">Total ride earnings</p></div></div>
      {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
        {rides.map(ride => (
          <div key={ride.id} className="p-5 hover:bg-slate-50/60 transition-colors">
            <div className="flex flex-wrap items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ride.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}><CheckCircle size={18} /></div>
              <div className="flex-1 min-w-60">
                <div className="flex items-center gap-2"><p className="font-mono text-sm font-semibold text-slate-700">{ride.bookingRef}</p><span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${ride.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{ride.status}</span></div>
                <p className="text-sm font-medium text-slate-700 mt-2">{ride.customerName}</p>
                <div className="mt-2 space-y-1"><p className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin size={12} className="text-green-500" /> {ride.pickupAddress}</p><p className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin size={12} className="text-red-400" /> {ride.dropoffAddress}</p></div>
                <div className="mt-2"><StarRating value={ride.customerRating} size={12} /></div>
                {ride.customerFeedback && <p className="text-xs text-slate-500 italic mt-1">&ldquo;{ride.customerFeedback}&rdquo;</p>}
              </div>
              <div className="flex gap-5 text-right">
                <div><p className="text-xs text-slate-400 flex items-center justify-end gap-1"><Route size={11} /> Distance</p><p className="text-sm font-semibold text-slate-700">{ride.distance || '-'}</p></div>
                <div><p className="text-xs text-slate-400 flex items-center justify-end gap-1"><Users size={11} /> Passengers</p><p className="text-sm font-semibold text-slate-700">{ride.passengerCount}</p></div>
                <div><p className="text-xs text-slate-400">Payout</p><p className="text-lg font-bold text-slate-800">£{ride.driverPayoutAmount ?? ride.fareAmount}</p></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 ml-14">{new Date(ride.completedAt ?? ride.dateTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        ))}
        {!rides.length && <div className="py-16 text-center text-sm text-slate-400">No ride history yet.</div>}
      </div>
    </div>
  );
}
