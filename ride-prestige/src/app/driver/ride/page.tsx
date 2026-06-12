'use client';
import { useState, useEffect } from 'react';
import { Phone, CheckCircle, Navigation } from 'lucide-react';
import { driverApi } from '@/lib/api-client';

interface ActiveRide {
  id: string; bookingRef: string; status: string;
  customerName: string; customerPhone: string; passengerCount: number;
  pickupAddress: string; dropoffAddress: string;
  fareAmount: number; distance?: string; driverPayoutAmount?: number;
}

type RideStep = 'on_route' | 'arrived_pickup' | 'in_progress' | 'completed';
const STEPS: { key: RideStep; label: string; action: string; nextStatus: string }[] = [
  { key: 'on_route',       label: 'En Route to Pickup',  action: "I've Arrived at Pickup", nextStatus: 'arrived_pickup' },
  { key: 'arrived_pickup', label: 'Arrived at Pickup',   action: 'Start Ride',              nextStatus: 'in_progress'    },
  { key: 'in_progress',    label: 'Ride in Progress',    action: 'Complete Ride',           nextStatus: 'completed'      },
  { key: 'completed',      label: 'Ride Completed',      action: '',                        nextStatus: ''               },
];

export default function DriverRidePage() {
  const [ride, setRide]         = useState<ActiveRide | null>(null);
  const [stepIndex, setStep]    = useState(0);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    driverApi.get<{ success: boolean; data: ActiveRide | null }>('/api/driver/jobs/current')
      .then(r => {
        setRide(r.data);
        if (r.data) {
          const idx = STEPS.findIndex(s => s.key === r.data!.status);
          setStep(idx >= 0 ? idx : 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const advance = async () => {
    if (!ride || updating) return;
    const next = STEPS[stepIndex + 1];
    if (!next) return;
    setUpdating(true);
    try {
      await driverApi.put(`/api/driver/jobs/${ride.id}/status`, { status: next.key });
      setStep(i => i + 1);
      setRide(r => r ? { ...r, status: next.key } : r);
    } finally { setUpdating(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading…</div>;

  if (!ride) return (
    <div className="px-4 py-5 text-center">
      <div className="rounded-2xl py-16" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Navigation size={36} className="mx-auto text-zinc-600 mb-3" />
        <p className="text-zinc-400 font-medium">No active ride</p>
        <p className="text-zinc-600 text-sm mt-1">Accept a ride from the dashboard to see it here</p>
      </div>
    </div>
  );

  const current   = STEPS[stepIndex] ?? STEPS[0];
  const isComplete = current.key === 'completed';

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Active Ride</h1>
        <p className="text-zinc-500 text-sm">{ride.bookingRef}</p>
      </div>

      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: isComplete ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${isComplete ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: isComplete ? '#10b981' : '#f59e0b' }} />
        <p className="font-semibold text-sm" style={{ color: isComplete ? '#10b981' : '#f59e0b' }}>{current.label}</p>
      </div>

      <div className="rounded-2xl p-5" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center mt-1 gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: stepIndex >= 2 ? '#10b981' : '#f59e0b' }} />
            <div className="w-0.5 h-10" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="w-3 h-3 rounded-full bg-red-400" />
          </div>
          <div className="flex-1 space-y-3">
            <div><p className="text-xs text-zinc-500">Pickup</p><p className="font-semibold text-white">{ride.pickupAddress}</p></div>
            <div><p className="text-xs text-zinc-500">Drop-off</p><p className="font-semibold text-white">{ride.dropoffAddress}</p></div>
          </div>
        </div>
        <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[{ label: 'Miles', value: ride.distance ?? '—' }, { label: 'Fare', value: `£${ride.driverPayoutAmount ?? ride.fareAmount}` }, { label: 'Pax', value: ride.passengerCount }].map(({ label, value }) => (
            <div key={label} className="flex-1 text-center">
              <p className="font-bold text-white">{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-white shrink-0">{ride.customerName.charAt(0)}</div>
            <div><p className="font-semibold text-white">{ride.customerName}</p><p className="text-xs text-zinc-400">{ride.passengerCount} passenger{ride.passengerCount !== 1 ? 's' : ''}</p></div>
          </div>
          <a href={`tel:${ride.customerPhone}`} className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Phone size={18} className="text-amber-400" />
          </a>
        </div>
      </div>

      <a href={`https://maps.google.com/?q=${encodeURIComponent(stepIndex < 2 ? ride.pickupAddress : ride.dropoffAddress)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Navigation size={16} /> Navigate to {stepIndex < 2 ? 'Pickup' : 'Drop-off'}
      </a>

      {!isComplete && (
        <button onClick={advance} disabled={updating} className="w-full py-4 rounded-2xl font-bold text-base text-black disabled:opacity-70" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
          {updating ? '…' : current.action}
        </button>
      )}

      {isComplete && (
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
          <p className="font-bold text-white text-lg">Ride Completed!</p>
          <p className="text-green-400 font-bold text-2xl mt-1">+£{ride.driverPayoutAmount ?? ride.fareAmount}</p>
          <p className="text-zinc-400 text-sm mt-1">Added to today&apos;s earnings</p>
        </div>
      )}
    </div>
  );
}
