'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Phone, Route, Clock, User, Car, Building2, CheckCircle } from 'lucide-react';
import { opsApi } from '@/lib/api-client';
import StarRating from '@/components/common/StarRating';

interface Job {
  id: string; bookingRef: string; status: string;
  customerName: string; customerPhone: string; customerEmail?: string;
  pickupAddress: string; dropoffAddress: string; stops?: string[];
  dateTime: string; passengerCount: number; luggageCount: number;
  vehicleCategory: string; vehicleTypeRequested: string;
  fareAmount: number; commissionAmount: number; affiliatePayoutAmount: number;
  distance: string; estimatedDuration: string;
  specialInstructions?: string; flightNumber?: string;
  affiliateId?: string; assignedDriverId?: string; assignedVehicleId?: string;
  createdAt: string; updatedAt: string; completedAt?: string;
  customerRating?: number | null; customerFeedback?: string | null;
}
interface Driver  { id: string; fullName: string; email: string; phone: string; status: string; rating: number; totalJobs: number; }
interface Affiliate { id: string; companyName: string; contactPerson: string; email: string; phone: string; }
interface Vehicle { id: string; make: string; model: string; registration: string; colour: string; vehicleType: string; }

const STATUS_COLORS: Record<string, string> = {
  awaiting_affiliate: '#f59e0b', needs_allocation: '#f59e0b',
  driver_assigned: '#3b82f6', vehicle_assigned: '#3b82f6', driver_accepted: '#3b82f6',
  on_route: '#8b5cf6', arrived_pickup: '#8b5cf6', passenger_onboard: '#8b5cf6',
  in_progress: '#10b981', completed: '#6b7280', cancelled: '#ef4444',
};
const TIMELINE = ['awaiting_affiliate','needs_allocation','driver_assigned','vehicle_assigned','driver_accepted','on_route','arrived_pickup','passenger_onboard','in_progress','completed'];

export default function RideDetailPage() {
  const { id } = useParams() as { id: string };
  const [job, setJob]           = useState<Job | null>(null);
  const [driver, setDriver]     = useState<Driver | null>(null);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [vehicle, setVehicle]   = useState<Vehicle | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    opsApi.get<{ success: boolean; data: Job; driver: Driver | null; affiliate: Affiliate | null; vehicle: Vehicle | null }>(`/api/ops/rides/${id}`)
      .then(r => { setJob(r.data); setDriver(r.driver); setAffiliate(r.affiliate); setVehicle(r.vehicle); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!job) return;
    setUpdating(true);
    try {
      const r = await opsApi.put<{ success: boolean; data: Job }>(`/api/ops/rides/${id}/status`, { status });
      setJob(r.data);
    } finally { setUpdating(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading ride…</div>;
  if (error)   return <div className="p-8 text-red-500">Error: {error}. <Link href="/ops/rides" className="text-blue-500">Back to rides</Link></div>;
  if (!job)    return <div className="p-8 text-center text-slate-500">Ride not found. <Link href="/ops/rides" className="text-blue-500">Back to rides</Link></div>;

  const timelineStep = TIMELINE.indexOf(job.status);

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/ops/rides" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm"><ArrowLeft size={15} /> Back</Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-600 font-mono font-semibold">{job.bookingRef}</span>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize ml-auto" style={{ background: (STATUS_COLORS[job.status] ?? '#94a3b8') + '20', color: STATUS_COLORS[job.status] ?? '#94a3b8' }}>{job.status.replace(/_/g, ' ')}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Route */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Route size={16} className="text-blue-500" /> Journey Details</h2>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-3 h-3 rounded-full bg-green-500" /><div className="w-0.5 h-10 bg-slate-200" /><div className="w-3 h-3 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-4">
                <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Pickup</p><p className="font-semibold text-slate-800">{job.pickupAddress}</p></div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Drop-off</p><p className="font-semibold text-slate-800">{job.dropoffAddress}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
              {[{ label: 'Distance', value: job.distance }, { label: 'Est. Fare', value: `£${job.fareAmount}` }, { label: 'Passengers', value: job.passengerCount }].map(({ label, value }) => (
                <div key={label} className="text-center p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                  <p className="font-bold text-slate-800">{value}</p><p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {job.specialInstructions && <p className="mt-4 text-sm text-slate-600 bg-amber-50 rounded-xl p-3 border border-amber-100">📝 {job.specialInstructions}</p>}
            {job.flightNumber && <p className="mt-2 text-sm text-slate-600">✈️ Flight: <strong>{job.flightNumber}</strong></p>}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Clock size={16} className="text-blue-500" /> Ride Timeline</h2>
            <div className="space-y-3">
              {TIMELINE.map((step, i) => {
                const done = i <= timelineStep;
                const current = i === timelineStep;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? (current ? '#3b82f6' : '#10b981') : '#e2e8f0' }}>
                      {done ? <CheckCircle size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                    </div>
                    <p className="text-sm capitalize font-medium" style={{ color: done ? '#1e293b' : '#94a3b8' }}>{step.replace(/_/g, ' ')}</p>
                    {current && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold ml-auto">Current</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status update */}
          {!['completed','cancelled'].includes(job.status) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-3 text-sm">Update Status</h2>
              <div className="flex flex-wrap gap-2">
                {['cancelled','completed'].map(s => (
                  <button key={s} onClick={() => updateStatus(s)} disabled={updating} className="px-4 py-2 rounded-xl text-xs font-semibold capitalize text-white disabled:opacity-50" style={{ background: s === 'cancelled' ? '#ef4444' : '#10b981' }}>
                    {updating ? '…' : `Mark ${s}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><User size={15} className="text-blue-500" /> Customer</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">{job.customerName.charAt(0)}</div>
              <div><p className="font-semibold text-slate-800">{job.customerName}</p><p className="text-xs text-slate-400">{job.customerEmail}</p></div>
            </div>
            <a href={`tel:${job.customerPhone}`} className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#3b82f6' }}>
              <Phone size={13} /> {job.customerPhone}
            </a>
          </div>

          {/* Driver */}
          {driver && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Car size={15} className="text-green-500" /> Driver</h2>
              <p className="font-semibold text-slate-800">{driver.fullName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{driver.email}</p>
              <div className="flex gap-3 mt-3 text-xs text-slate-500">
                <span>⭐ {driver.rating || '—'}</span><span>{driver.totalJobs} rides</span>
              </div>
              <a href={`tel:${driver.phone}`} className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold text-white mt-3" style={{ background: '#10b981' }}>
                <Phone size={13} /> Call Driver
              </a>
            </div>
          )}

          {/* Affiliate */}
          {affiliate && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Building2 size={15} className="text-purple-500" /> Affiliate</h2>
              <p className="font-semibold text-slate-800">{affiliate.companyName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{affiliate.contactPerson}</p>
            </div>
          )}

          {/* Vehicle */}
          {vehicle && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Car size={15} className="text-blue-500" /> Vehicle</h2>
              <p className="font-semibold text-slate-800">{vehicle.make} {vehicle.model}</p>
              <p className="text-xs text-slate-500 mt-0.5">{vehicle.registration} · {vehicle.colour}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-3 text-sm">Customer Feedback</h2>
            <StarRating value={job.customerRating} size={17} />
            <p className="text-sm text-slate-500 mt-3">{job.customerFeedback || (job.customerRating ? 'No written feedback was provided.' : 'The customer has not rated this ride yet.')}</p>
          </div>

          {/* Fare breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-3 text-sm">Fare & ROI Breakdown</h2>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Customer Fare', value: `£${job.fareAmount}` },
                { label: 'Ride Prestige ROI', value: `£${job.commissionAmount}` },
                { label: affiliate ? 'Affiliate Payout' : 'Independent Driver Payout', value: `£${job.affiliatePayoutAmount}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between"><span className="text-slate-400">{label}</span><span className="font-medium text-slate-700">{value}</span></div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-3 text-sm">Booking Info</h2>
            <div className="space-y-2 text-xs">
              {[{ label: 'Category', value: job.vehicleCategory }, { label: 'Vehicle Type', value: job.vehicleTypeRequested }, { label: 'Date/Time', value: new Date(job.dateTime).toLocaleString('en-GB') }, { label: 'Created', value: new Date(job.createdAt).toLocaleString('en-GB') }].map(({ label, value }) => (
                <div key={label} className="flex justify-between"><span className="text-slate-400">{label}</span><span className="font-medium text-slate-700 capitalize">{value}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
