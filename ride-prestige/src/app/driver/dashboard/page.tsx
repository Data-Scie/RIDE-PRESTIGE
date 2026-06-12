'use client';
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Star, CheckCircle, Navigation } from 'lucide-react';
import { driverApi } from '@/lib/api-client';

interface DriverProfile {
  id: string; fullName: string; status: string;
  rating?: number; totalJobs: number; earningsToday?: number;
  vehicleMake?: string; vehicleModel?: string; licencePlate?: string; vehicleColour?: string;
}
interface RideRequest {
  id: string; bookingRef: string; fareAmount: number; distance?: string;
  passengerCount: number; pickupAddress: string; dropoffAddress: string; customerPhone?: string;
}

export default function DriverDashboard() {
  const [profile, setProfile]     = useState<DriverProfile | null>(null);
  const [online, setOnline]       = useState(false);
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [accepted, setAccepted]   = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    driverApi.get<{ success: boolean; data: DriverProfile }>('/api/driver/profile')
      .then(r => { setProfile(r.data); setOnline(r.data.status !== 'offline'); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pollForRide = useCallback(() => {
    if (!online) return;
    // Independent drivers see open jobs; affiliate drivers see assigned jobs via /jobs/my
    driverApi.get<{ success: boolean; data: RideRequest[] }>('/api/driver/jobs/available')
      .then(r => {
        const first = Array.isArray(r.data) ? r.data[0] : null;
        if (first && !accepted) { setRideRequest(first as unknown as RideRequest); setCountdown(30); }
      })
      .catch(() => {
        // Affiliate driver — check for newly assigned jobs
        driverApi.get<{ success: boolean; data: RideRequest[] }>('/api/driver/jobs/my')
          .then(r => {
            const assigned = Array.isArray(r.data) ? r.data.find(j => (j as unknown as { status: string }).status === 'driver_assigned') : null;
            if (assigned && !accepted) { setRideRequest(assigned as unknown as RideRequest); setCountdown(30); }
          })
          .catch(() => {});
      });
  }, [online, accepted]);

  useEffect(() => {
    if (!online) return;
    const interval = setInterval(pollForRide, 5000);
    pollForRide();
    return () => clearInterval(interval);
  }, [online, pollForRide]);

  useEffect(() => {
    if (!rideRequest || accepted) return;
    if (countdown <= 0) { setRideRequest(null); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [rideRequest, countdown, accepted]);

  const toggleOnline = async () => {
    const next = !online;
    setOnline(next);
    if (!next) { setRideRequest(null); setAccepted(false); }
    await driverApi.put('/api/driver/status', { status: next ? 'available' : 'offline' }).catch(() => {});
  };

  const acceptRide = async () => {
    if (!rideRequest) return;
    await driverApi.post(`/api/driver/jobs/${rideRequest.id}/accept`, {}).catch(() => {});
    setAccepted(true); setRideRequest(null);
  };

  const declineRide = () => {
    setRideRequest(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading…</div>;

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="rounded-3xl p-6 text-center" style={{ background: online ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `2px solid ${online ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: online ? '#10b981' : 'rgba(255,255,255,0.3)' }}>{online ? '● Online — receiving rides' : '○ Offline'}</p>
        <button onClick={toggleOnline} className="w-24 h-24 rounded-full font-bold text-lg transition-all mx-auto flex items-center justify-center" style={{ background: online ? '#10b981' : '#2a2a2a', color: online ? 'white' : 'rgba(255,255,255,0.5)', boxShadow: online ? '0 0 40px rgba(16,185,129,0.4)' : 'none' }}>
          {online ? 'GO OFFLINE' : 'GO ONLINE'}
        </button>
        <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>{online ? 'Tap to go offline' : 'Tap to start receiving ride requests'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Today's Earnings", value: `£${profile?.earningsToday ?? 0}`, icon: TrendingUp, color: '#f59e0b' },
          { label: 'Rating',           value: profile?.rating ?? '—',            icon: Star,       color: '#f59e0b' },
          { label: 'Total Rides',      value: profile?.totalJobs ?? 0,           icon: CheckCircle,color: '#10b981' },
          { label: 'Status',           value: online ? 'Online' : 'Offline',     icon: Navigation, color: online ? '#10b981' : '#94a3b8' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Icon size={18} style={{ color }} className="mb-2" />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
          </div>
        ))}
      </div>

      {profile && (
        <div className="rounded-2xl p-5" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-black shrink-0" style={{ background: '#f59e0b' }}>{profile.fullName.charAt(0)}</div>
            <div>
              <p className="font-bold text-white text-lg">{profile.fullName}</p>
              {profile.vehicleMake && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{profile.vehicleMake} {profile.vehicleModel} · {profile.licencePlate}</p>}
              {profile.vehicleColour && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{profile.vehicleColour} · Independent Driver</p>}
            </div>
          </div>
        </div>
      )}

      {rideRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#1a1a1a', border: '2px solid #f59e0b' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-lg">New Ride Request!</h3>
              <div className="w-10 h-10 rounded-full border-2 border-amber-400 flex items-center justify-center">
                <span className="font-bold text-amber-400">{countdown}</span>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center mt-1 gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" /><div className="w-0.5 h-4 bg-zinc-600" /><div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-400">Pickup</p><p className="text-sm font-semibold text-white">{rideRequest.pickupAddress}</p>
                    <p className="text-xs text-zinc-500 mt-1">Drop-off</p><p className="text-sm font-semibold text-white">{rideRequest.dropoffAddress}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 text-center">
                {[{ label: 'Fare', value: `£${rideRequest.fareAmount}`, amber: true }, { label: 'Miles', value: rideRequest.distance ?? '—', amber: false }, { label: 'Pax', value: rideRequest.passengerCount, amber: false }].map(({ label, value, amber }) => (
                  <div key={label} className="flex-1 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className={`font-bold text-lg ${amber ? 'text-amber-400' : 'text-white'}`}>{value}</p>
                    <p className="text-xs text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={acceptRide} className="flex-1 py-4 rounded-2xl font-bold text-black text-base" style={{ background: '#f59e0b' }}>✓ Accept</button>
              <button onClick={declineRide} className="flex-1 py-4 rounded-2xl font-bold text-base" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>✗ Decline</button>
            </div>
          </div>
        </div>
      )}

      {accepted && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)' }}>
          <p className="font-bold text-green-400 mb-1">Ride Accepted!</p>
          <p className="text-sm text-zinc-300">Check the Ride tab for details and navigation.</p>
        </div>
      )}
    </div>
  );
}
