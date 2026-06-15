'use client';
import { useEffect, useState } from 'react';
import { affiliateApi } from '@/lib/api-client';
import StarRating from '@/components/common/StarRating';

interface Job {
  id: string; bookingRef: string; status: string;
  customerName: string; pickupAddress: string; dropoffAddress: string;
  yourEarnings?: number; distance?: string;
  passengerCount: number; completedAt?: string; dateTime: string;
  driverName?: string;
  customerRating?: number | null; customerFeedback?: string | null;
}

export default function AffiliateHistoryPage() {
  const [rides, setRides]   = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    affiliateApi.get<{ success: boolean; data: Job[] }>('/api/affiliate/jobs/history')
      .then(r => setRides(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading history…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>;

  const totalEarned = rides.reduce((s, r) => s + (r.yourEarnings ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Ride History</h1>
          <p className="text-slate-500 text-sm">{rides.length} rides · £{totalEarned.toFixed(2)} total earned</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
        {rides.length === 0 ? (
          <p className="py-12 text-center text-slate-400 text-sm">No ride history yet</p>
        ) : rides.map(r => (
          <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.status === 'completed' ? '#10b981' : r.status === 'cancelled' ? '#ef4444' : '#f59e0b' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><span className="font-mono text-sm font-semibold text-slate-800">{r.bookingRef}</span><span className="text-xs text-slate-400 capitalize">{r.status.replace(/_/g, ' ')}</span></div>
              <p className="text-xs text-slate-500 truncate">{r.customerName} · {r.pickupAddress}</p>
              {r.driverName && <p className="text-xs text-slate-400">Driver: {r.driverName}</p>}
              <div className="mt-1"><StarRating value={r.customerRating} size={11} /></div>
              {r.customerFeedback && <p className="text-xs text-slate-500 italic mt-1">&ldquo;{r.customerFeedback}&rdquo;</p>}
              <p className="text-xs text-slate-400">{new Date(r.dateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-slate-800">£{r.yourEarnings ?? 0}</p>
              {r.distance && <p className="text-xs text-slate-400">{r.distance}</p>}
              <p className="text-xs text-slate-400">{r.passengerCount} pax</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
