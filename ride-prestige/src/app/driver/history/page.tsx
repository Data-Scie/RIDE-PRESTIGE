'use client';
import { useEffect, useState } from 'react';
import { driverApi } from '@/lib/api-client';

interface Job {
  id: string; bookingRef: string; status: string;
  pickupAddress: string; dropoffAddress: string;
  fareAmount: number; driverPayoutAmount?: number;
  distance?: string; passengerCount: number;
  customerName: string; dateTime: string; completedAt?: string;
}

export default function DriverHistoryPage() {
  const [rides, setRides]     = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driverApi.get<{ success: boolean; data: Job[] }>('/api/driver/jobs/history')
      .then(r => setRides(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading history…</div>;

  return (
    <div className="px-4 py-5 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Ride History</h1>
        <p className="text-zinc-500 text-sm">{rides.length} rides completed</p>
      </div>
      <div className="space-y-3">
        {rides.length === 0 ? (
          <div className="rounded-2xl py-12 text-center" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-zinc-400">No completed rides yet</p>
          </div>
        ) : rides.map(r => (
          <div key={r.id} className="rounded-2xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-semibold text-zinc-300">{r.bookingRef}</span>
              <span className="font-bold text-amber-400 text-lg">£{r.driverPayoutAmount ?? r.fareAmount}</span>
            </div>
            <p className="text-xs text-zinc-400 mb-1 truncate">{r.pickupAddress} → {r.dropoffAddress}</p>
            {r.distance && <p className="text-xs text-zinc-500">{r.distance} · {r.passengerCount} pax</p>}
            <p className="text-xs text-zinc-500">{r.customerName}</p>
            <p className="text-xs text-zinc-600 mt-1">{new Date(r.completedAt ?? r.dateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
