'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Search } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface Affiliate {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  postcode: string;
  operatorLicenceNumber: string;
  companyRegNumber: string;
  isApproved: boolean;
  createdAt: string;
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get<{ success: boolean; data: Affiliate[] }>('/api/admin/affiliates')
      .then(result => setAffiliates(result.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const setApproval = async (affiliate: Affiliate, approve: boolean) => {
    setUpdating(affiliate.id);
    setError('');
    try {
      const result = await adminApi.put<{ success: boolean; data: Affiliate }>(
        `/api/admin/affiliates/${affiliate.id}/approve`,
        { approve },
      );
      setAffiliates(current => current.map(item => item.id === affiliate.id ? result.data : item));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdating(null);
    }
  };

  const visible = affiliates.filter(affiliate => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && !affiliate.isApproved) ||
      (filter === 'approved' && affiliate.isApproved);
    const term = search.toLowerCase();
    const matchesSearch = !term || [affiliate.companyName, affiliate.contactPerson, affiliate.email]
      .some(value => value.toLowerCase().includes(term));
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading affiliates...</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Affiliate Applications</h1>
        <p className="text-sm text-slate-500">
          {affiliates.filter(item => !item.isApproved).length} pending applications
        </p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company, contact, or email"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none"
          />
        </div>
        {(['all', 'pending', 'approved'] as const).map(value => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className="px-4 py-2 rounded-xl text-xs font-semibold capitalize"
            style={{ background: filter === value ? '#0a0f1e' : '#f8fafc', color: filter === value ? 'white' : '#64748b' }}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {visible.map(affiliate => (
          <div key={affiliate.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Building2 size={21} className="text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/admin/affiliates/${affiliate.id}`} className="font-bold text-slate-800 hover:text-amber-600">{affiliate.companyName}</Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${affiliate.isApproved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {affiliate.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{affiliate.contactPerson} · {affiliate.email} · {affiliate.phone}</p>
                <p className="text-xs text-slate-400">{affiliate.city}, {affiliate.postcode} · Company {affiliate.companyRegNumber} · Operator {affiliate.operatorLicenceNumber}</p>
                <p className="text-xs text-slate-400 mt-1">Applied {new Date(affiliate.createdAt).toLocaleString('en-GB')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!affiliate.isApproved ? (
                <>
                  <button disabled={updating === affiliate.id} onClick={() => setApproval(affiliate, true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-green-600 disabled:opacity-50">Approve</button>
                  <button disabled={updating === affiliate.id} onClick={() => setApproval(affiliate, false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 disabled:opacity-50">Reject</button>
                </>
              ) : (
                <button disabled={updating === affiliate.id} onClick={() => setApproval(affiliate, false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 disabled:opacity-50">Suspend</button>
              )}
            </div>
          </div>
        ))}
        {!visible.length && <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center text-slate-400">No affiliate applications found.</div>}
      </div>
    </div>
  );
}
