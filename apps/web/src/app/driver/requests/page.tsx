'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, Route, X } from 'lucide-react';
import { driverApi } from '@/lib/api-client';

interface RideItem {
  id: string;
  jobId?: string;
  bookingRef: string;
  status: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  yourEarnings?: number | null;
  distance?: string;
  passengerCount: number;
  dateTime: string;
  expiresAt?: string;
}

interface DriverProfile {
  driverType: 'affiliateDriver' | 'independentDriver';
}

const AWAITING_ACCEPT_STATUSES = ['driver_assigned', 'vehicle_assigned'];
const ACTIVE_STATUSES = ['driver_accepted', 'on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress'];

export default function DriverRequestsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [incoming, setIncoming] = useState<RideItem[]>([]);
  const [active, setActive] = useState<RideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState<string | null>(null);

  const load = async () => {
    setError('');
    try {
      const profileResult = await driverApi.get<{ success: boolean; data: DriverProfile }>('/api/driver/profile');
      setProfile(profileResult.data);
      const isIndependent = profileResult.data.driverType === 'independentDriver';

      const myJobs = await driverApi.get<{ success: boolean; data: RideItem[] }>('/api/driver/jobs/my');
      setActive(myJobs.data.filter(job => ACTIVE_STATUSES.includes(job.status)));

      if (isIndependent) {
        const offers = await driverApi.get<{ success: boolean; data: RideItem[] }>('/api/driver/jobs/available');
        setIncoming(offers.data);
      } else {
        setIncoming(myJobs.data.filter(job => AWAITING_ACCEPT_STATUSES.includes(job.status)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load ride requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const acceptRide = async (item: RideItem) => {
    setActioning(item.id);
    setError('');
    try {
      const action = profile?.driverType === 'independentDriver' ? 'claim' : 'accept';
      await driverApi.post(`/api/driver/jobs/${item.id}/${action}`, {});
      await load();
      router.push('/driver/ride');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept this ride - it may have already expired or been taken.');
      await load();
    } finally {
      setActioning(null);
    }
  };

  const declineRide = async (item: RideItem) => {
    setActioning(item.id);
    setError('');
    try {
      await driverApi.post(`/api/driver/jobs/${item.id}/decline`, {});
      setIncoming(prev => prev.filter(r => r.id !== item.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not decline this ride');
    } finally {
      setActioning(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading ride requests...</div>;

  const isIndependent = profile?.driverType === 'independentDriver';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ride Requests</h1>
        <p className="text-slate-500 text-sm">{incoming.length} incoming - {active.length} active</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      {incoming.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Incoming Requests</h2>
          <div className="space-y-3">
            {incoming.map(ride => (
              <div key={ride.id} className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-slate-800">{ride.bookingRef}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{ride.passengerCount} pax</span>
                    </div>
                    <div className="flex items-start gap-2 mb-3">
                      <div className="flex flex-col items-center mt-1 gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" /><div className="w-0.5 h-5 bg-slate-200" /><div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      </div>
                      <div className="space-y-1.5">
                        <div><p className="text-xs text-slate-400">Pickup</p><p className="text-sm font-semibold text-slate-800">{ride.pickupAddress}</p></div>
                        <div><p className="text-xs text-slate-400">Drop-off</p><p className="text-sm font-semibold text-slate-800">{ride.dropoffAddress}</p></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      {ride.distance && <span className="flex items-center gap-1"><Route size={11} /> {ride.distance}</span>}
                      <span className="flex items-center gap-1"><Clock size={11} /> {new Date(ride.dateTime).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                      {isIndependent && <span className="font-bold text-lg text-green-700">Payout £{ride.yourEarnings ?? 0}</span>}
                    </div>
                    {ride.expiresAt && <p className="text-xs text-amber-600 mt-2">Expires {new Date(ride.expiresAt).toLocaleTimeString('en-GB')}</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button disabled={actioning === ride.id} onClick={() => acceptRide(ride)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50" style={{ background: '#10b981' }}>
                      <CheckCircle size={15} /> {actioning === ride.id ? 'Processing...' : 'Accept'}
                    </button>
                    {isIndependent && (
                      <button disabled={actioning === ride.id} onClick={() => declineRide(ride)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50" style={{ background: '#fef2f2', color: '#ef4444' }}>
                        <X size={15} /> Decline
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Active Rides</h2>
          <div className="space-y-3">
            {active.map(ride => (
              <button key={ride.id} onClick={() => router.push('/driver/ride')} className="w-full text-left bg-white rounded-2xl border border-green-200 shadow-sm p-5 hover:border-green-300 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-slate-800">{ride.bookingRef}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold capitalize">{ride.status.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-sm text-slate-600">{ride.pickupAddress} → {ride.dropoffAddress}</p>
                  </div>
                  {isIndependent && <p className="font-bold text-xl text-slate-800">£{ride.yourEarnings ?? 0}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {incoming.length === 0 && active.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <CheckCircle size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No ride requests at the moment</p>
          <p className="text-slate-400 text-sm">New requests will appear here automatically</p>
        </div>
      )}
    </div>
  );
}
