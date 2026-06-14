'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Route, Plus } from 'lucide-react';
import { opsApi } from '@/lib/api-client';
import StarRating from '@/components/common/StarRating';

interface Job {
  id: string; bookingRef: string; status: string;
  customerName: string; customerPhone: string;
  pickupAddress: string; dropoffAddress: string;
  fareAmount: number; vehicleCategory: string;
  assignedDriverId?: string; affiliateId?: string;
  dateTime: string;
  customerRating?: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  awaiting_affiliate: '#f59e0b', needs_allocation: '#f59e0b',
  driver_assigned: '#3b82f6', driver_accepted: '#3b82f6',
  vehicle_assigned: '#3b82f6', on_route: '#8b5cf6', arrived_pickup: '#8b5cf6',
  passenger_onboard: '#8b5cf6',
  in_progress: '#10b981', completed: '#6b7280', cancelled: '#ef4444',
};

export default function OpsRidesPage() {
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const load = () => opsApi.get<{ success: boolean; data: Job[] }>('/api/ops/rides')
    .then(r => {
      setJobs(r.data);
      setError('');
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.bookingRef.toLowerCase().includes(search.toLowerCase()) || j.customerName.toLowerCase().includes(search.toLowerCase());
    const activeStatuses = ['driver_assigned', 'vehicle_assigned', 'driver_accepted', 'on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress'];
    const matchStatus = statusFilter === 'all' || (statusFilter === 'in_progress' ? activeStatuses.includes(j.status) : j.status === statusFilter);
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading rides…</div>;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>All Rides</h1>
          <p className="text-slate-500 text-sm">{jobs.length} total rides in system</p>
        </div>
        <Link href="/ops/rides/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#3b82f6' }}>
          <Plus size={14} /> New Ride
        </Link>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          <span>Could not refresh rides: {error}</span>
          <button onClick={load} className="px-3 py-1.5 rounded-lg bg-white border border-red-200 font-semibold">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ref or customer…" className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-slate-200 focus:border-blue-400" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all','awaiting_affiliate','needs_allocation','in_progress','completed','cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize" style={{ background: statusFilter === s ? (STATUS_COLORS[s] || '#3b82f6') : '#f8fafc', color: statusFilter === s ? 'white' : '#64748b', border: '1px solid', borderColor: statusFilter === s ? 'transparent' : '#e2e8f0' }}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Reference','Customer','Route','Category','Fare','Rating','Assigned','Status',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4"><span className="font-mono text-sm font-semibold text-slate-700">{job.bookingRef}</span></td>
                  <td className="px-5 py-4"><p className="text-sm font-medium text-slate-800">{job.customerName}</p><p className="text-xs text-slate-400">{job.customerPhone}</p></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5"><Route size={12} className="text-slate-400" /><span className="text-xs text-slate-600 truncate max-w-32">{job.pickupAddress} → {job.dropoffAddress}</span></div>
                  </td>
                  <td className="px-5 py-4"><span className="text-sm capitalize text-slate-600">{job.vehicleCategory}</span></td>
                  <td className="px-5 py-4"><span className="font-semibold text-slate-800">£{job.fareAmount}</span></td>
                  <td className="px-5 py-4"><StarRating value={job.customerRating} showValue={false} size={12} /></td>
                  <td className="px-5 py-4">
                    {job.assignedDriverId ? <span className="text-xs text-green-600 font-medium">Driver assigned</span> : job.affiliateId ? <span className="text-xs text-blue-600 font-medium">Affiliate assigned</span> : <span className="text-xs text-slate-400">Unassigned</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize" style={{ background: (STATUS_COLORS[job.status] ?? '#94a3b8') + '20', color: STATUS_COLORS[job.status] ?? '#94a3b8' }}>{job.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-5 py-4"><Link href={`/ops/rides/${job.id}`} className="text-blue-500 hover:text-blue-700"><ArrowRight size={16} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-16 text-center text-slate-400">No rides match your filters</div>}
        </div>
      </div>
    </div>
  );
}
