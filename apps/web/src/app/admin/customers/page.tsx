'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, Receipt, Search } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import StarRating from '@/components/common/StarRating';

interface Customer {
  id: string;
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  totalJobs?: number;
  totalBookings?: number;
  totalSpend?: number;
  isGuest?: boolean;
  createdAt: string;
  averageCustomerRating?: number | null;
  latestRide?: {
    bookingRef: string;
    status: string;
    dateTime: string;
    acceptedBy?: 'affiliate' | 'independent_driver' | 'unassigned';
    affiliateName?: string | null;
    driverName?: string | null;
    driverType?: string | null;
    pickupAddress?: string;
    dropoffAddress?: string;
    vehicleCategory?: string;
    fareAmount?: number;
  } | null;
}

type CustomersResponse = {
  success?: boolean;
  data?: Customer[];
  customers?: Customer[];
};

function getCustomerName(customer: Customer) {
  return customer.fullName || customer.name || customer.email || customer.phone || 'Guest customer';
}

function getCustomerInitial(customer: Customer) {
  const name = getCustomerName(customer).trim();
  return (name.charAt(0) || 'C').toUpperCase();
}

function formatCurrency(value?: number | null) {
  return `GBP ${(Number(value) || 0).toFixed(2)}`;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => adminApi.get<CustomersResponse | Customer[]>('/api/admin/customers')
    .then(result => {
      const rows = Array.isArray(result) ? result : result.data ?? result.customers ?? [];
      setCustomers(rows);
      setError('');
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const term = search.toLowerCase();
  const filtered = customers.filter(customer =>
    !term || [getCustomerName(customer), customer.email, customer.phone, customer.latestRide?.bookingRef]
      .some(value => value?.toLowerCase().includes(term))
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading customers...</div>;

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>Customers</h1>
        <p className="text-slate-500 text-sm">{customers.length} registered and guest booking customers</p>
      </div>
      {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">Could not refresh customers: {error}</div>}
      <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0f0f0' }}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone or booking reference" className="w-full max-w-lg pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-slate-200 focus:border-blue-400" />
        </div>
      </div>
      <div className="bg-white rounded-2xl overflow-x-auto" style={{ border: '1px solid #f0f0f0' }}>
        <table className="w-full min-w-[1120px] text-sm">
          <thead>
            <tr className="bg-slate-50">
              {['Customer', 'Contact', 'Latest ride', 'Ride route', 'Handled by', 'Affiliate', 'Driver', 'Status', 'Rides / spend'].map(header => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(customer => {
              const rideCount = customer.totalJobs ?? customer.totalBookings ?? 0;
              const isGuest = customer.isGuest ?? false;
              const ride = customer.latestRide;
              const customerName = getCustomerName(customer);
              const handledBy = ride?.acceptedBy === 'affiliate'
                ? 'Affiliate'
                : ride?.acceptedBy === 'independent_driver'
                  ? 'Independent driver'
                  : 'Unassigned';
              return (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">{getCustomerInitial(customer)}</div>
                      <div>
                        <p className="font-semibold text-slate-800">{customerName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isGuest ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{isGuest ? 'Guest booking' : 'Registered'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {customer.email && <p className="flex items-center gap-1 text-xs text-slate-500"><Mail size={11} /> {customer.email}</p>}
                    {customer.phone && <p className="flex items-center gap-1 text-xs text-slate-500 mt-1"><Phone size={11} /> {customer.phone}</p>}
                  </td>
                  <td className="px-4 py-4">
                    {ride ? <p className="flex items-center gap-1 font-mono text-xs text-slate-700"><Receipt size={11} /> {ride.bookingRef}</p> : <span className="text-slate-400">No rides</span>}
                    {ride?.dateTime && <p className="text-xs text-slate-400 mt-1">{new Date(ride.dateTime).toLocaleDateString('en-GB')}</p>}
                  </td>
                  <td className="px-4 py-4">
                    {ride ? <p className="text-xs text-slate-500">{ride.pickupAddress ?? '-'} to {ride.dropoffAddress ?? '-'}</p> : <span className="text-slate-400">-</span>}
                    {ride?.vehicleCategory && <p className="text-xs text-slate-400 capitalize mt-1">{ride.vehicleCategory}</p>}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{handledBy}</td>
                  <td className="px-4 py-4 text-slate-600">{ride?.affiliateName ?? '-'}</td>
                  <td className="px-4 py-4 text-slate-600">{ride?.driverName ?? '-'}</td>
                  <td className="px-4 py-4">
                    {ride ? <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">{ride.status.replace(/_/g, ' ')}</span> : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-700">{rideCount} rides - {formatCurrency(customer.totalSpend)}</p>
                    <StarRating value={customer.averageCustomerRating} size={11} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && <div className="py-12 text-center text-slate-400 text-sm">No customers found</div>}
      </div>
    </div>
  );
}
