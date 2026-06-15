'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, MapPin, Navigation, Phone, Route, Users } from 'lucide-react';
import { driverApi } from '@/lib/api-client';

interface ActiveRide {
  id: string;
  bookingRef: string;
  status: string;
  customerName: string;
  customerPhone: string;
  passengerCount: number;
  pickupAddress: string;
  dropoffAddress: string;
  yourEarnings?: number | null;
  distance?: string;
  estimatedDuration?: string;
  specialInstructions?: string;
}

const STEPS = [
  { key: 'driver_accepted', label: 'Job Accepted', action: 'Start Journey', next: 'on_route' },
  { key: 'on_route', label: 'En Route to Pickup', action: 'Arrived at Pickup', next: 'arrived_pickup' },
  { key: 'arrived_pickup', label: 'At Pickup', action: 'Passenger On Board', next: 'passenger_onboard' },
  { key: 'passenger_onboard', label: 'Passenger On Board', action: 'Start Ride', next: 'in_progress' },
  { key: 'in_progress', label: 'Ride In Progress', action: 'Complete Ride', next: 'completed' },
  { key: 'completed', label: 'Ride Completed', action: '', next: '' },
];

export default function DriverRidePage() {
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const load = () => driverApi.get<{ success: boolean; data: ActiveRide | null }>('/api/driver/jobs/current')
    .then(result => setRide(result.data))
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const acceptAssignment = async () => {
    if (!ride) return;
    setUpdating(true);
    try {
      await driverApi.post(`/api/driver/jobs/${ride.id}/accept`, {});
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  const advance = async () => {
    if (!ride) return;
    const current = STEPS.find(step => step.key === ride.status);
    if (!current?.next) return;
    setUpdating(true);
    try {
      await driverApi.put(`/api/driver/jobs/${ride.id}/status`, { status: current.next });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading active ride...</div>;

  if (!ride) return (
    <div className="max-w-4xl space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-800">Active Ride</h1><p className="text-sm text-slate-500">Your current assignment and journey controls</p></div>
      <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4"><Navigation size={26} className="text-slate-300" /></div>
        <p className="font-semibold text-slate-700">No active ride</p>
        <p className="text-sm text-slate-400 mt-1">A ride assigned by your affiliate, or one you claim directly, will appear here.</p>
      </div>
    </div>
  );

  const assigned = ['driver_assigned', 'vehicle_assigned'].includes(ride.status);
  const currentIndex = STEPS.findIndex(step => step.key === ride.status);
  const current = STEPS[currentIndex];
  const completed = ride.status === 'completed';

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-800">Active Ride</h1><p className="text-sm text-slate-500">{ride.bookingRef}</p></div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${completed ? 'bg-green-50 text-green-700' : assigned ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{ride.status.replace(/_/g, ' ')}</span>
      </div>
      {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-5">Journey</h2>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center pt-1"><div className="w-3 h-3 rounded-full bg-green-500" /><div className="w-0.5 h-16 bg-slate-200" /><div className="w-3 h-3 rounded-full bg-red-500" /></div>
              <div className="flex-1 space-y-8">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pickup</p><p className="font-semibold text-slate-800 mt-1">{ride.pickupAddress}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Drop-off</p><p className="font-semibold text-slate-800 mt-1">{ride.dropoffAddress}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
              <Metric icon={Route} label="Distance" value={ride.distance || 'Pending'} />
              <Metric icon={Navigation} label="Duration" value={ride.estimatedDuration || 'Pending'} />
              <Metric icon={Users} label="Passengers" value={String(ride.passengerCount)} />
            </div>
          </div>

          {!assigned && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-800 mb-5">Ride Progress</h2>
              <div className="flex items-start overflow-x-auto pb-2">
                {STEPS.map((step, index) => {
                  const done = index < currentIndex;
                  const active = index === currentIndex;
                  return <div key={step.key} className="flex items-start flex-1 min-w-28"><div className="flex flex-col items-center flex-1"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{done ? '✓' : index + 1}</div><p className={`text-[11px] text-center mt-2 ${active ? 'text-blue-700 font-semibold' : 'text-slate-400'}`}>{step.label}</p></div>{index < STEPS.length - 1 && <div className={`h-0.5 flex-1 mt-4 ${done ? 'bg-green-400' : 'bg-slate-200'}`} />}</div>;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Passenger</h2>
            <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold">{ride.customerName.charAt(0)}</div><div><p className="font-semibold text-slate-800">{ride.customerName}</p><p className="text-xs text-slate-400">{ride.passengerCount} passenger{ride.passengerCount !== 1 ? 's' : ''}</p></div></div>
            <a href={`tel:${ride.customerPhone}`} className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 text-slate-700 text-sm font-semibold"><Phone size={15} /> Call Passenger</a>
          </div>
          {ride.yourEarnings !== null && ride.yourEarnings !== undefined && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Your Payout</p><p className="text-3xl font-bold text-slate-800 mt-1">£{ride.yourEarnings}</p>
            </div>
          )}
          {ride.specialInstructions && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-400">SPECIAL INSTRUCTIONS</p>
              <p className="text-sm text-slate-600 mt-1">{ride.specialInstructions}</p>
            </div>
          )}
          <a href={`https://maps.google.com/?q=${encodeURIComponent(currentIndex < 2 ? ride.pickupAddress : ride.dropoffAddress)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white font-semibold text-sm"><MapPin size={16} /> Open Navigation</a>
          {assigned ? <button onClick={acceptAssignment} disabled={updating} className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50">{updating ? 'Accepting...' : 'Accept Assignment'}</button> : !completed && <button onClick={advance} disabled={updating} className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50">{updating ? 'Updating...' : current?.action}</button>}
          {completed && <div className="p-5 rounded-2xl bg-green-50 border border-green-100 text-center"><CheckCircle size={30} className="mx-auto text-green-600 mb-2" /><p className="font-bold text-green-800">Ride Completed</p></div>}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Route; label: string; value: string }) {
  return <div className="text-center"><Icon size={16} className="mx-auto text-blue-500 mb-1" /><p className="font-semibold text-sm text-slate-700">{value}</p><p className="text-[11px] text-slate-400">{label}</p></div>;
}
