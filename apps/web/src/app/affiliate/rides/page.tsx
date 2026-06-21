'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Route, X } from 'lucide-react';
import { affiliateApi } from '@/lib/api-client';

interface Job {
  id: string;
  bookingRef: string;
  status: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  yourEarnings: number;
  vehicleCategory: string;
  passengerCount: number;
  distance?: string;
  dateTime: string;
  assignedDriverId?: string | null;
  assignedVehicleId?: string | null;
}

interface Driver {
  id: string;
  fullName: string;
  status: string;
  documentsStatus?: string;
  applicationStatus?: string;
  isApproved?: boolean;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  registration: string;
  status: string;
  vehicleCategory?: string;
  passengerCapacity?: number;
  luggageCapacity?: number;
  isApproved?: boolean;
  approvalStatus?: string;
}

export default function AffiliateRidesPage() {
  const [pending, setPending] = useState<Job[]>([]);
  const [active, setActive] = useState<Job[]>([]);
  // Full roster - used only to look up names for already-assigned drivers/vehicles in the active list.
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  // Eligible-for-this-job lists - populated fresh each time the assignment modal opens. Kept
  // separate from allDrivers/allVehicles so the modal never shows stale, ineligible candidates
  // from the unfiltered roster while the real eligibility check is still loading.
  const [eligibleDrivers, setEligibleDrivers] = useState<Driver[]>([]);
  const [eligibleVehicles, setEligibleVehicles] = useState<Vehicle[]>([]);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [assignRide, setAssignRide] = useState<Job | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assigningError, setAssigningError] = useState('');

  const load = () => Promise.all([
    affiliateApi.get<{ success: boolean; data: Job[] }>('/api/affiliate/jobs/new'),
    affiliateApi.get<{ success: boolean; data: Job[] }>('/api/affiliate/jobs/accepted'),
    affiliateApi.get<{ success: boolean; data: Driver[] }>('/api/affiliate/drivers'),
    affiliateApi.get<{ success: boolean; data: Vehicle[] }>('/api/affiliate/vehicles'),
  ])
    .then(([p, a, d, v]) => {
      setPending(p.data);
      setActive(a.data);
      setAllDrivers(d.data);
      setAllVehicles(v.data);
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const acceptRide = async (id: string) => {
    const ride = [...pending, ...active].find(item => item.id === id) ?? null;
    setAssignModal(id);
    setAssignRide(ride);
    setSelectedDriver(ride?.assignedDriverId ?? '');
    setSelectedVehicle(ride?.assignedVehicleId ?? '');
    setAssigningError('');
    setEligibleDrivers([]);
    setEligibleVehicles([]);
    setLoadingEligibility(true);
    try {
      const [d, v] = await Promise.all([
        affiliateApi.get<{ success: boolean; data: Driver[] }>(`/api/affiliate/drivers?status=available&jobId=${encodeURIComponent(id)}`),
        affiliateApi.get<{ success: boolean; data: Vehicle[] }>(`/api/affiliate/vehicles?status=available&jobId=${encodeURIComponent(id)}`),
      ]);
      setEligibleDrivers(d.data);
      setEligibleVehicles(v.data);
    } catch (e) {
      setAssigningError(e instanceof Error ? e.message : 'Could not load eligible drivers and vehicles');
    } finally {
      setLoadingEligibility(false);
    }
  };

  const declineRide = async (id: string) => {
    await affiliateApi.post(`/api/affiliate/jobs/${id}/reject`, {});
    setPending(prev => prev.filter(r => r.id !== id));
  };

  const confirmAssign = async () => {
    if (!selectedDriver || !selectedVehicle || !assignModal) return;
    setSubmitting(true);
    setAssigningError('');
    try {
      if (assignRide?.status === 'awaiting_affiliate' || pending.some(ride => ride.id === assignModal)) {
        try {
          await affiliateApi.post(`/api/affiliate/jobs/${assignModal}/accept`, {});
        } catch (e) {
          // A previous attempt may have already accepted this job before a later step failed -
          // that's not a real failure, carry on to vehicle/driver assignment regardless.
          if ((e as { status?: number }).status !== 409) throw e;
        }
      }
      await affiliateApi.post(`/api/affiliate/jobs/${assignModal}/assign-vehicle`, { vehicleId: selectedVehicle });
      await affiliateApi.post(`/api/affiliate/jobs/${assignModal}/assign-driver`, { driverId: selectedDriver });
      await load();
      setAssignModal(null);
      setAssignRide(null);
      setSelectedDriver('');
      setSelectedVehicle('');
    } catch (e) {
      setAssigningError(e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAllocation = async (id: string) => {
    if (!window.confirm('Reset this ride allocation and release its driver/vehicle?')) return;
    setError('');
    try {
      await affiliateApi.post(`/api/affiliate/jobs/${id}/reset-allocation`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset allocation');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading rides...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Ride Requests</h1>
        <p className="text-slate-500 text-sm">{pending.length} incoming - {active.length} active</p>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Incoming Requests</h2>
          <div className="space-y-3">
            {pending.map(ride => (
              <div key={ride.id} className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-slate-800">{ride.bookingRef}</span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold capitalize">{ride.vehicleCategory}</span>
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
                      <span className="font-bold text-lg text-green-700">Payout GBP {ride.yourEarnings}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => acceptRide(ride.id)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ background: '#10b981' }}>
                      <CheckCircle size={15} /> Accept
                    </button>
                    <button onClick={() => declineRide(ride.id)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: '#fef2f2', color: '#ef4444' }}>
                      <X size={15} /> Decline
                    </button>
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
            {active.map(ride => {
              const assignedDriver = allDrivers.find(driver => driver.id === ride.assignedDriverId);
              const assignedVehicle = allVehicles.find(vehicle => vehicle.id === ride.assignedVehicleId);
              return (
                <div key={ride.id} className="bg-white rounded-2xl border border-green-200 shadow-sm p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-slate-800">{ride.bookingRef}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold capitalize">{ride.status.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm text-slate-600">{ride.pickupAddress} -&gt; {ride.dropoffAddress}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-50 border border-slate-100 px-2 py-1">Driver: {assignedDriver?.fullName || 'Not allocated'}</span>
                        <span className="rounded-full bg-slate-50 border border-slate-100 px-2 py-1">Vehicle: {assignedVehicle ? `${assignedVehicle.make} ${assignedVehicle.model} - ${assignedVehicle.registration}` : 'Not allocated'}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div><p className="font-bold text-xl text-slate-800">GBP {ride.yourEarnings}</p><p className="text-xs text-slate-400">Partner payout</p>{ride.distance && <p className="text-xs text-slate-400">{ride.distance}</p>}</div>
                      {['needs_allocation', 'driver_assigned', 'vehicle_assigned'].includes(ride.status) && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => acceptRide(ride.id)} className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold">Manage allocation</button>
                          <button onClick={() => resetAllocation(ride.id)} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">Reset</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length === 0 && active.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <CheckCircle size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No ride requests at the moment</p>
          <p className="text-slate-400 text-sm">New requests will appear here automatically</p>
        </div>
      )}

      {assignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-5" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Assign Driver &amp; Vehicle</h3>
            {assignRide && <p className="mb-4 text-xs text-slate-500">Ride {assignRide.bookingRef} · {assignRide.status.replace(/_/g, ' ')}</p>}
            {assigningError && <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{assigningError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Select Driver *</label>
                <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} disabled={loadingEligibility} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400 disabled:opacity-50">
                  <option value="">{loadingEligibility ? 'Checking eligible drivers...' : 'Choose a driver...'}</option>
                  {eligibleDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
                {!loadingEligibility && eligibleDrivers.length === 0 && <p className="mt-2 text-xs text-amber-600">No available approved drivers with current documents for this ride.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Select Vehicle *</label>
                <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} disabled={loadingEligibility} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400 disabled:opacity-50">
                  <option value="">{loadingEligibility ? 'Checking eligible vehicles...' : 'Choose a vehicle...'}</option>
                  {eligibleVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} - {v.registration}</option>
                  ))}
                </select>
                {!loadingEligibility && eligibleVehicles.length === 0 && <p className="mt-2 text-xs text-amber-600">No approved available vehicles match this ride category, capacity, and compliance requirements.</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={confirmAssign} disabled={!selectedDriver || !selectedVehicle || submitting || loadingEligibility} className="flex-1 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50" style={{ background: '#10b981' }}>
                {submitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
              <button onClick={() => { setAssignModal(null); setAssignRide(null); }} className="flex-1 py-3 rounded-xl font-semibold text-sm" style={{ background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
