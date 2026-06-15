'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Building2, Car, Users, ArrowRight, Star } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

interface Affiliate {
  id: string; companyName: string; contactPerson: string; email: string; phone: string;
  address?: string; registrationNumber?: string; isApproved: boolean;
  driverCount?: number; vehicleCount?: number; totalJobs?: number; rating?: number;
  commissionRate?: number; createdAt: string;
}

export default function OpsAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [updating, setUpdating]     = useState<string | null>(null);

  const loadAffiliates = async () => {
    const result = await opsApi.get<{ success: boolean; data: Affiliate[] }>('/api/ops/affiliates');
    setAffiliates(result.data);
  };

  useEffect(() => {
    loadAffiliates()
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const approve = async (id: string) => {
    setUpdating(id);
    setError('');
    try {
      await opsApi.put(`/api/ops/affiliates/${id}/approve`, {});
      await loadAffiliates();
    } catch (e) {
      const requestError = e as Error & { status?: number };
      if (requestError.status === 404) {
        setAffiliates(current => current.filter(affiliate => affiliate.id !== id));
        setError('That application no longer exists. The list has been refreshed.');
      } else {
        setError(requestError.message || 'Could not approve affiliate');
      }
    } finally {
      setUpdating(null);
    }
  };

  const suspend = async (id: string) => {
    setUpdating(id);
    setError('');
    try {
      await opsApi.put(`/api/ops/affiliates/${id}/suspend`, {});
      await loadAffiliates();
    } catch (e) {
      const requestError = e as Error & { status?: number };
      if (requestError.status === 404) {
        setAffiliates(current => current.filter(affiliate => affiliate.id !== id));
        setError('That affiliate no longer exists. The list has been refreshed.');
      } else {
        setError(requestError.message || 'Could not suspend affiliate');
      }
    } finally {
      setUpdating(null);
    }
  };

  const reject = async (id: string) => {
    if (!confirm('Reject this affiliate application? This will prevent them from joining the platform.')) return;
    setUpdating(id);
    setError('');
    try {
      await opsApi.put(`/api/ops/affiliates/${id}/suspend`, {});
      await loadAffiliates();
    } catch (e) {
      const requestError = e as Error & { status?: number };
      if (requestError.status === 404) {
        setAffiliates(current => current.filter(affiliate => affiliate.id !== id));
        setError('That application no longer exists. The list has been refreshed.');
      } else {
        setError(requestError.message || 'Could not reject affiliate');
      }
    } finally {
      setUpdating(null);
    }
  };

  const filtered = affiliates.filter(a => {
    const matchSearch = !search || a.companyName.toLowerCase().includes(search.toLowerCase()) || a.contactPerson.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'pending' && !a.isApproved) || (filter === 'approved' && a.isApproved);
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading affiliates…</div>;
  const pendingCount  = affiliates.filter(a => !a.isApproved).length;
  const approvedCount = affiliates.filter(a => a.isApproved).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Affiliate Companies</h1>
        <p className="text-slate-500 text-sm">{pendingCount} pending · {approvedCount} approved</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search affiliates…" className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-slate-200 focus:border-blue-400" />
        </div>
        <div className="flex gap-2">
          {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} className="px-3 py-2 rounded-xl text-xs font-medium transition-all" style={{ background: filter === key ? '#3b82f6' : '#f8fafc', color: filter === key ? 'white' : '#64748b', border: '1px solid', borderColor: filter === key ? 'transparent' : '#e2e8f0' }}>{label}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map(a => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                  <Building2 size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-lg">{a.companyName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.isApproved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{a.isApproved ? 'Approved' : 'Pending'}</span>
                  </div>
                  <p className="text-sm text-slate-600">{a.contactPerson} · {a.email}</p>
                  {a.address && <p className="text-xs text-slate-400">{a.address}</p>}
                  {a.registrationNumber && <p className="text-xs text-slate-400 mt-0.5">Reg: {a.registrationNumber} · Joined {new Date(a.createdAt).toLocaleDateString('en-GB')}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!a.isApproved && (
                  <>
                    <button onClick={() => approve(a.id)} disabled={updating === a.id} className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#10b981' }}>{updating === a.id ? '…' : 'Approve'}</button>
                    <button onClick={() => reject(a.id)} disabled={updating === a.id} className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#fef2f2', color: '#ef4444' }}>Reject</button>
                  </>
                )}
                {a.isApproved && (
                  <button onClick={() => suspend(a.id)} disabled={updating === a.id} className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#fef2f2', color: '#ef4444' }}>{updating === a.id ? '…' : 'Suspend'}</button>
                )}
                <Link href={`/ops/affiliates/${a.id}`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#3b82f6' }}>
                  View <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {a.isApproved && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
                {[
                  { icon: Users, label: 'Drivers',     value: a.driverCount  ?? 0, color: '#3b82f6' },
                  { icon: Car,   label: 'Vehicles',    value: a.vehicleCount ?? 0, color: '#8b5cf6' },
                  { icon: Building2, label: 'Total Rides', value: a.totalJobs ?? 0, color: '#10b981' },
                  { icon: Star,  label: 'Rating',      value: a.rating       ?? '—', color: '#f59e0b' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '15' }}><Icon size={15} style={{ color }} /></div>
                    <div><p className="font-bold text-slate-800 text-sm">{value}</p><p className="text-xs text-slate-400">{label}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-400 text-sm">No affiliates found</div>}
      </div>
    </div>
  );
}
