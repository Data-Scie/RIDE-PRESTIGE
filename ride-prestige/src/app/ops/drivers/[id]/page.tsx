'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Phone, Mail, Car, CheckCircle, XCircle, Star } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

interface Driver {
  id: string; fullName: string; email: string; phone: string;
  status: string; isApproved: boolean;
  rating: number; totalJobs: number; vehicleType?: string;
  licencePlate?: string; vehicleMake?: string; vehicleModel?: string; vehicleColour?: string;
  licenceNumber?: string; hasInsurance?: boolean; hasDbs?: boolean; hasLicence?: boolean;
  affiliateId?: string; createdAt: string;
}
interface RecentJob {
  id: string; bookingRef: string; status: string; pickupAddress: string; dropoffAddress: string; fareAmount: number;
}

export default function DriverDetailPage() {
  const { id } = useParams() as { id: string };
  const [driver, setDriver]   = useState<Driver | null>(null);
  const [rides, setRides]     = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    opsApi.get<{ success: boolean; data: Driver; jobs: RecentJob[] }>(`/api/ops/drivers/${id}`)
      .then(r => { setDriver(r.data); setRides(r.jobs ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const approve = async () => {
    if (!driver) return;
    setUpdating(true);
    try {
      const r = await opsApi.put<{ success: boolean; data: Driver }>(`/api/ops/drivers/${id}/approve`, {});
      setDriver(r.data);
    } finally { setUpdating(false); }
  };

  const suspend = async () => {
    if (!driver) return;
    setUpdating(true);
    try {
      const r = await opsApi.put<{ success: boolean; data: Driver }>(`/api/ops/drivers/${id}/suspend`, {});
      setDriver(r.data);
    } finally { setUpdating(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading driver…</div>;
  if (error)   return <div className="p-8 text-red-500">Error: {error}. <Link href="/ops/drivers" className="text-blue-500">Back</Link></div>;
  if (!driver) return <div className="p-8 text-center text-slate-500">Driver not found. <Link href="/ops/drivers" className="text-blue-500">Back</Link></div>;

  const statusColor = driver.status === 'busy' ? '#10b981' : driver.status === 'available' ? '#3b82f6' : '#94a3b8';

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/ops/drivers" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm"><ArrowLeft size={15} /> Back to Drivers</Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0" style={{ background: statusColor }}>{driver.fullName.charAt(0)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>{driver.fullName}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${driver.isApproved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{driver.isApproved ? 'Approved' : 'Pending'}</span>
              <span className="text-xs capitalize font-medium" style={{ color: statusColor }}>● {driver.status}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <a href={`tel:${driver.phone}`} className="flex items-center gap-1.5 hover:text-blue-500"><Phone size={13} /> {driver.phone}</a>
              <a href={`mailto:${driver.email}`} className="flex items-center gap-1.5 hover:text-blue-500"><Mail size={13} /> {driver.email}</a>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!driver.isApproved && <button onClick={approve} disabled={updating} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60" style={{ background: '#10b981' }}>{updating ? '…' : 'Approve'}</button>}
            {driver.isApproved && <button onClick={suspend} disabled={updating} className="px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60" style={{ background: '#fef2f2', color: '#ef4444' }}>{updating ? '…' : 'Suspend'}</button>}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          {[{ label: 'Total Rides', value: driver.totalJobs }, { label: 'Rating', value: driver.rating ? <span className="flex items-center justify-center gap-1"><Star size={13} className="text-amber-400 fill-amber-400" />{driver.rating}</span> : '—' }, { label: 'Vehicle Type', value: driver.vehicleType || '—' }, { label: 'Joined', value: new Date(driver.createdAt).toLocaleDateString('en-GB') }].map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background: '#f8fafc' }}>
              <div className="font-bold text-slate-800 text-sm flex justify-center">{value}</div><p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Car size={15} className="text-blue-500" /> Vehicle</h2>
          <div className="space-y-2 text-sm">
            {[{ label: 'Make', value: driver.vehicleMake || '—' }, { label: 'Model', value: driver.vehicleModel || '—' }, { label: 'Colour', value: driver.vehicleColour || '—' }, { label: 'Plate', value: driver.licencePlate || '—' }, { label: 'Type', value: driver.vehicleType || '—' }].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">{label}</span><span className="font-medium text-slate-700 capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Documents</h2>
          <div className="space-y-3">
            {[{ label: "Driver's Licence", ok: driver.hasLicence }, { label: 'Insurance Certificate', ok: driver.hasInsurance }, { label: 'DBS Check', ok: driver.hasDbs }].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
                <span className="text-sm font-medium text-slate-700">{label}</span>
                {ok ? <CheckCircle size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-400" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {rides.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Recent Rides</h2>
          <div className="space-y-2">
            {rides.slice(0, 10).map(r => (
              <Link key={r.id} href={`/ops/rides/${r.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="font-mono text-sm text-slate-700">{r.bookingRef}</span>
                <span className="text-xs text-slate-500 truncate max-w-40">{r.pickupAddress}</span>
                <span className="font-semibold text-slate-800 shrink-0">£{r.fareAmount}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
