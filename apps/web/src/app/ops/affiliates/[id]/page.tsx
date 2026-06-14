'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Phone, Mail, MapPin, Car, Users } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

interface Affiliate {
  id: string; companyName: string; contactPerson: string; email: string; phone: string;
  address?: string; registrationNumber?: string; isApproved: boolean;
  totalJobs?: number; activeRides?: number; rating?: number; commissionRate?: number; createdAt: string;
}
interface Driver  { id: string; fullName: string; email: string; phone: string; status: string; licencePlate?: string; }
interface Vehicle { id: string; make: string; model: string; registration: string; colour: string; vehicleType: string; status: string; }

const STATUS_DOT: Record<string, string> = { available: '#10b981', busy: '#3b82f6', offline: '#94a3b8' };

export default function AffiliateDetailPage() {
  const { id } = useParams() as { id: string };
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [drivers, setDrivers]     = useState<Driver[]>([]);
  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [updating, setUpdating]   = useState(false);

  useEffect(() => {
    opsApi.get<{ success: boolean; data: Affiliate; drivers: Driver[]; vehicles: Vehicle[] }>(`/api/ops/affiliates/${id}`)
      .then(r => { setAffiliate(r.data); setDrivers(r.drivers ?? []); setVehicles(r.vehicles ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const approve = async () => {
    setUpdating(true);
    setError('');
    try {
      const r = await opsApi.put<{ success: boolean; data: Affiliate }>(`/api/ops/affiliates/${id}/approve`, {});
      setAffiliate(r.data);
    } catch (e) {
      setError((e as Error).message || 'Could not approve affiliate');
    } finally {
      setUpdating(false);
    }
  };

  const suspend = async () => {
    setUpdating(true);
    setError('');
    try {
      const r = await opsApi.put<{ success: boolean; data: Affiliate }>(`/api/ops/affiliates/${id}/suspend`, {});
      setAffiliate(r.data);
    } catch (e) {
      setError((e as Error).message || 'Could not suspend affiliate');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading affiliate…</div>;
  if (error)   return <div className="p-8 text-red-500">Error: {error}. <Link href="/ops/affiliates" className="text-blue-500">Back</Link></div>;
  if (!affiliate) return <div className="p-8 text-center text-slate-500">Affiliate not found. <Link href="/ops/affiliates" className="text-blue-500">Back</Link></div>;

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/ops/affiliates" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm"><ArrowLeft size={15} /> Back to Affiliates</Link>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-semibold ${affiliate.isApproved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{affiliate.isApproved ? 'Approved' : 'Pending'}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
            <Users size={26} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>{affiliate.companyName}</h1>
            <p className="text-slate-600">{affiliate.contactPerson}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
              <a href={`tel:${affiliate.phone}`} className="flex items-center gap-1.5 hover:text-blue-500"><Phone size={13} /> {affiliate.phone}</a>
              <a href={`mailto:${affiliate.email}`} className="flex items-center gap-1.5 hover:text-blue-500"><Mail size={13} /> {affiliate.email}</a>
              {affiliate.address && <span className="flex items-center gap-1.5"><MapPin size={13} /> {affiliate.address}</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!affiliate.isApproved && <button onClick={approve} disabled={updating} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60" style={{ background: '#10b981' }}>{updating ? '…' : 'Approve'}</button>}
            {affiliate.isApproved && <button onClick={suspend} disabled={updating} className="px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60" style={{ background: '#fef2f2', color: '#ef4444' }}>{updating ? '…' : 'Suspend'}</button>}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          {[{ label: 'Total Rides', value: affiliate.totalJobs ?? 0 }, { label: 'Active Rides', value: affiliate.activeRides ?? 0 }, { label: 'Rating', value: affiliate.rating || '—' }, { label: 'Reg No.', value: affiliate.registrationNumber || '—' }].map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background: '#f8fafc' }}>
              <p className="font-bold text-slate-800">{value}</p><p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Users size={15} className="text-blue-500" /> Drivers ({drivers.length})</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {drivers.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">No drivers registered yet</p>
            ) : drivers.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: STATUS_DOT[d.status] ?? '#94a3b8' }}>{d.fullName.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{d.fullName}</p>
                  <p className="text-xs text-slate-400">{d.licencePlate || d.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[d.status] ?? '#94a3b8' }} />
                  <span className="text-xs capitalize" style={{ color: STATUS_DOT[d.status] ?? '#94a3b8' }}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Car size={15} className="text-purple-500" /> Vehicles ({vehicles.length})</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {vehicles.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">No vehicles registered yet</p>
            ) : vehicles.map(v => (
              <div key={v.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: v.status === 'available' ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)' }}>
                  <Car size={16} style={{ color: v.status === 'available' ? '#10b981' : '#94a3b8' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{v.make} {v.model}</p>
                  <p className="text-xs text-slate-400">{v.registration} · {v.colour} · {v.vehicleType}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.status === 'available' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{v.status === 'available' ? 'Available' : 'On ride'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
