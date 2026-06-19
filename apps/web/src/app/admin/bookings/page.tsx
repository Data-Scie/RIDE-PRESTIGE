'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Eye, MapPin, Users, Calendar } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminApi } from '@/lib/api-client';
import { getCategoryLabel } from '@/lib/fare';
import type { BookingStatus, VehicleCategory } from '@/types';
import StarRating from '@/components/common/StarRating';

interface ApiBooking {
  id: string; reference: string; status: BookingStatus; createdAt: string; updatedAt: string;
  customer: { fullName?: string; email?: string; phone?: string } | null;
  journey: { pickupPostcode?: string; dropoffPostcode?: string; date?: string; time?: string; passengers?: number } | null;
  vehicleCategory: string; vehicleId: string | null;
  estimatedMiles: number | null; estimatedFare: number | null; adminNotes: string | null;
  operationalStatus?: string | null;
  customerRating?: number | null; customerFeedback?: string | null; assignedDriverId?: string | null;
  acceptedBy?: 'driver' | 'affiliate' | null; affiliateName?: string | null; affiliateDriverName?: string | null;
  driverName?: string | null; driverType?: string | null; assignedVehicleId?: string | null; vehicleLabel?: string | null;
}

const STATUS_OPTIONS: (BookingStatus | 'all')[] = ['all', 'pending', 'quoted', 'accepted', 'in_progress', 'rejected', 'completed', 'cancelled'];
const VEHICLE_OPTIONS: (VehicleCategory | 'all')[] = ['all', 'prestige', 'minibus', 'coaches', 'taxi'];

function AdminBookingsPageInner() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filterStatus, setFilterStatus]   = useState(searchParams.get('status') ?? 'all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<ApiBooking | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving]     = useState(false);

  const load = (showLoader = false) => {
    if (showLoader) setLoading(true);
    adminApi.get<{ success: boolean; data: ApiBooking[] }>('/api/admin/bookings?limit=100')
      .then(r => setBookings(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(), 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = bookings.filter(b => {
    const matchStatus  = filterStatus  === 'all' || b.status          === filterStatus;
    const matchVehicle = filterVehicle === 'all' || b.vehicleCategory === filterVehicle;
    const matchSearch  = !search || [b.customer?.fullName, b.reference, b.customer?.email].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    );
    return matchStatus && matchVehicle && matchSearch;
  });

  const updateStatus = async (id: string, status: BookingStatus) => {
    setSaving(true);
    try {
      const r = await adminApi.put<{ success: boolean; data: ApiBooking }>(`/api/admin/bookings/${id}`, { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...r.data } : b));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...r.data } : r.data);
    } finally { setSaving(false); }
  };

  const saveNote = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await adminApi.put<{ success: boolean; data: ApiBooking }>(`/api/admin/bookings/${selected.id}`, { adminNotes: adminNote });
      setBookings(prev => prev.map(b => b.id === selected.id ? { ...b, ...r.data } : b));
      setSelected(prev => prev ? { ...prev, ...r.data } : r.data);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading bookings…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}. Is the backend running?</div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-brand-grey-pale border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search size={14} className="text-brand-grey" />
            <input type="text" placeholder="Search bookings…" value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-brand-black placeholder-brand-grey focus:outline-none w-full" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto text-sm py-2">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)} className="input-field w-auto text-sm py-2">
            {VEHICLE_OPTIONS.map(v => <option key={v} value={v}>{v === 'all' ? 'All vehicles' : getCategoryLabel(v as VehicleCategory)}</option>)}
          </select>
          <div className="text-xs text-brand-grey ml-auto">{filtered.length} results</div>
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
        <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${selected ? 'lg:col-span-2' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Reference', 'Customer', 'Journey', 'Vehicle', 'Affiliate', 'Driver', 'Rating', 'Date', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(b => (
                  <tr key={b.id} onClick={() => { setSelected(b); setAdminNote(b.adminNotes || ''); }}
                    className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selected?.id === b.id ? 'bg-brand-gold/4' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-brand-grey whitespace-nowrap">{b.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-black">{b.customer?.fullName ?? '—'}</p>
                      <p className="text-xs text-brand-grey">{b.customer?.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 max-w-40">
                      <p className="text-xs truncate text-brand-black font-mono">{b.journey?.pickupPostcode ?? '?'}</p>
                      <p className="text-xs truncate text-brand-grey font-mono">→ {b.journey?.dropoffPostcode ?? '?'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize whitespace-nowrap">
                      <p>{getCategoryLabel(b.vehicleCategory as VehicleCategory)}</p>
                      {b.vehicleLabel && <p className="text-[10px] text-brand-grey normal-case max-w-36 truncate" title={b.vehicleLabel}>{b.vehicleLabel}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.affiliateName ? <span className="text-xs font-medium text-brand-black">{b.affiliateName}</span> : <span className="text-xs text-brand-grey">Independent / none</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.driverName || b.affiliateDriverName ? (
                        <div>
                          <p className="text-xs font-medium text-brand-black">{b.driverName ?? b.affiliateDriverName}</p>
                          {b.driverType && <p className="text-[10px] text-brand-grey">{b.driverType === 'independentDriver' ? 'Independent' : 'Affiliate driver'}</p>}
                        </div>
                      ) : <span className="text-xs text-brand-grey">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3"><StarRating value={b.customerRating} showValue={false} size={11} /></td>
                    <td className="px-4 py-3 text-xs text-brand-grey whitespace-nowrap">{b.journey?.date ?? 'ASAP'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                      {b.operationalStatus && b.operationalStatus !== b.status && <p className="text-[10px] text-brand-grey mt-1 capitalize">{b.operationalStatus.replace(/_/g, ' ')}</p>}
                    </td>
                    <td className="hidden">
                      {b.acceptedBy === 'driver' && <span className="text-xs font-medium text-brand-black">Independent driver</span>}
                      {b.acceptedBy === 'affiliate' && (
                        <div>
                          <p className="text-xs font-medium text-brand-black">{b.affiliateName ?? 'Affiliate'}</p>
                          {b.affiliateDriverName && <p className="text-[10px] text-brand-grey">{b.affiliateDriverName}</p>}
                        </div>
                      )}
                      {!b.acceptedBy && <span className="text-xs text-brand-grey">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><Eye size={14} className="text-brand-grey" /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-brand-grey text-sm">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 h-fit">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-brand-grey">{selected.reference}</p>
                <h3 className="font-display text-lg font-semibold text-brand-black mt-0.5">{selected.customer?.fullName ?? '—'}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-brand-grey hover:text-brand-black text-xl leading-none">×</button>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">Customer</p>
              <p className="text-brand-black">{selected.customer?.email ?? '—'}</p>
              <p className="text-brand-black">{selected.customer?.phone ?? '—'}</p>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">Journey</p>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-brand-gold mt-0.5 shrink-0" />
                <span className="text-brand-black font-mono">{selected.journey?.pickupPostcode ?? '?'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-brand-charcoal/40 mt-0.5 shrink-0" />
                <span className="text-brand-black font-mono">{selected.journey?.dropoffPostcode ?? '?'}</span>
              </div>
              {selected.journey?.date && (
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-brand-grey" />
                  <span className="text-brand-grey">{selected.journey.date} at {selected.journey.time}</span>
                </div>
              )}
              {selected.journey?.passengers && (
                <div className="flex items-center gap-2">
                  <Users size={13} className="text-brand-grey" />
                  <span className="text-brand-grey">{selected.journey.passengers} passengers</span>
                </div>
              )}
              {selected.estimatedFare && (
                <p className="text-xs text-brand-grey">Estimated fare: <strong className="text-brand-black">£{selected.estimatedFare}</strong></p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-2">Customer rating</p>
              <StarRating value={selected.customerRating} size={16} />
              <p className="text-xs text-brand-grey mt-2">{selected.customerFeedback || (selected.customerRating ? 'No written feedback.' : 'Not rated yet.')}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-2">Update status</p>
              <div className="grid grid-cols-2 gap-2">
                {(['pending', 'quoted', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'] as BookingStatus[]).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} disabled={saving}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 capitalize ${
                      selected.status === s ? 'bg-brand-black text-white border-brand-black' : 'border-gray-200 text-brand-grey hover:border-gray-300 hover:text-brand-black'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-2">Admin notes</p>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
                placeholder="Add internal notes…" className="input-field resize-none text-xs" />
              <button onClick={saveNote} disabled={saving} className="mt-2 btn-gold w-full py-2 text-xs">
                {saving ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>}>
      <AdminBookingsPageInner />
    </Suspense>
  );
}
