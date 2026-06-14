'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, Receipt, Search } from 'lucide-react';
import { opsApi } from '@/lib/api-client';
import StarRating from '@/components/common/StarRating';

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  totalJobs: number;
  totalSpend: number;
  isGuest: boolean;
  createdAt: string;
  averageCustomerRating?: number | null;
  latestRide?: { bookingRef: string; status: string; dateTime: string } | null;
}

export default function OpsCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => opsApi.get<{ success: boolean; data: Customer[] }>('/api/ops/customers')
    .then(result => { setCustomers(result.data); setError(''); })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const term = search.toLowerCase();
  const filtered = customers.filter(customer =>
    !term || [customer.fullName, customer.email, customer.phone, customer.latestRide?.bookingRef]
      .some(value => value?.toLowerCase().includes(term))
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading customers...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
        <p className="text-slate-500 text-sm">{customers.length} registered and guest booking customers</p>
      </div>
      {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">Could not refresh customers: {error}</div>}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone or booking reference" className="w-full max-w-lg pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-slate-200 focus:border-blue-400" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
        {filtered.map(customer => (
          <div key={customer.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50">
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">{customer.fullName.charAt(0)}</div>
            <div className="flex-1 min-w-60">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800">{customer.fullName}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${customer.isGuest ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{customer.isGuest ? 'Guest booking' : 'Registered'}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {customer.email && <span className="flex items-center gap-1 text-xs text-slate-400"><Mail size={11} /> {customer.email}</span>}
                <span className="flex items-center gap-1 text-xs text-slate-400"><Phone size={11} /> {customer.phone}</span>
              </div>
              {customer.latestRide && <p className="flex items-center gap-1 text-xs text-slate-400 mt-2"><Receipt size={11} /> {customer.latestRide.bookingRef} · {customer.latestRide.status.replace(/_/g, ' ')}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{customer.totalJobs} rides · £{customer.totalSpend.toFixed(2)}</p>
              <StarRating value={customer.averageCustomerRating} size={11} />
              <p className="text-xs text-slate-400 mt-1">First seen {new Date(customer.createdAt).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        ))}
        {!filtered.length && <div className="py-12 text-center text-slate-400 text-sm">No customers found</div>}
      </div>
    </div>
  );
}
