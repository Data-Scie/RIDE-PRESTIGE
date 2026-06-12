'use client';
import { useState, useEffect } from 'react';
import { Phone, Mail, Search } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

interface Customer {
  id: string; fullName: string; email: string; phone: string;
  totalJobs?: number; totalSpend?: number; isActive?: boolean; createdAt: string;
}

export default function OpsCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    opsApi.get<{ success: boolean; data: Customer[] }>('/api/ops/customers')
      .then(r => setCustomers(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    !search || c.fullName.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading customers…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Customers</h1>
        <p className="text-slate-500 text-sm">{customers.length} customers in system</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="w-full max-w-sm pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-slate-200 focus:border-blue-400" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
        {filtered.map(c => (
          <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">{c.fullName.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800">{c.fullName}</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-slate-400"><Mail size={11} /> {c.email}</span>
                <span className="flex items-center gap-1 text-xs text-slate-400"><Phone size={11} /> {c.phone}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-slate-700">{c.totalJobs ?? 0} rides</p>
              {c.totalSpend !== undefined && <p className="text-xs text-slate-400">£{c.totalSpend} total</p>}
              <p className="text-xs text-slate-400">Joined {new Date(c.createdAt).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">No customers found</div>}
      </div>
    </div>
  );
}
