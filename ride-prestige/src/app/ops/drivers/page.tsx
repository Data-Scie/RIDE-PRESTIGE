'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Plus, CheckCircle, XCircle, Star } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

interface Driver {
  id: string; fullName: string; email: string; phone: string;
  status: string; isApproved: boolean; isActive: boolean;
  rating: number; totalJobs: number; vehicleType?: string;
  affiliateId?: string; createdAt: string;
}

const STATUS_DOT: Record<string, string> = { available: '#10b981', busy: '#3b82f6', offline: '#94a3b8' };

export default function OpsDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    opsApi.get<{ success: boolean; data: Driver[] }>('/api/ops/drivers')
      .then(r => setDrivers(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = drivers.filter(d => {
    const matchSearch = !search || d.fullName.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'pending' && !d.isApproved) || (filter === 'approved' && d.isApproved) || d.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading drivers…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Drivers</h1>
          <p className="text-slate-500 text-sm">{drivers.length} drivers in network</p>
        </div>
        <Link href="/ops/drivers/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#3b82f6' }}>
          <Plus size={14} /> Add Driver
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-slate-200 focus:border-blue-400" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'available', label: 'Available' }, { key: 'busy', label: 'Busy' }, { key: 'offline', label: 'Offline' }].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} className="px-3 py-2 rounded-xl text-xs font-medium transition-all" style={{ background: filter === key ? '#3b82f6' : '#f8fafc', color: filter === key ? 'white' : '#64748b', border: '1px solid', borderColor: filter === key ? 'transparent' : '#e2e8f0' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Driver','Contact','Status','Approved','Rating','Rides','Vehicle',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">{d.fullName.charAt(0)}</div>
                      <p className="font-semibold text-slate-800 text-sm">{d.fullName}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4"><p className="text-sm text-slate-600">{d.email}</p><p className="text-xs text-slate-400">{d.phone}</p></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[d.status] ?? '#94a3b8' }} />
                      <span className="text-xs capitalize font-medium" style={{ color: STATUS_DOT[d.status] ?? '#94a3b8' }}>{d.status}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {d.isApproved ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-amber-400" />}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" /><span className="text-sm font-medium">{d.rating || '—'}</span></div>
                  </td>
                  <td className="px-5 py-4"><span className="text-sm font-medium text-slate-700">{d.totalJobs}</span></td>
                  <td className="px-5 py-4"><span className="text-xs text-slate-500 capitalize">{d.vehicleType || '—'}</span></td>
                  <td className="px-5 py-4"><Link href={`/ops/drivers/${d.id}`} className="text-blue-500 hover:text-blue-700"><ArrowRight size={16} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-16 text-center text-slate-400">No drivers match your filters</div>}
        </div>
      </div>
    </div>
  );
}
