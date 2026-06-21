'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Star } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  rating: number;
  totalJobs: number;
  driverType: 'affiliateDriver' | 'independentDriver';
  applicationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  documentsStatus?: 'missing' | 'pending' | 'approved' | 'rejected' | 'expired';
  affiliate?: { id: string; companyName: string } | null;
}

const STATUS_DOT: Record<string, string> = { available: '#10b981', busy: '#3b82f6', offline: '#94a3b8' };
type DriverSection = 'all' | 'available' | 'busy' | 'offline' | 'independentDriver' | 'affiliateDriver' | 'approved' | 'suspended';

const SECTIONS: { key: DriverSection; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'busy', label: 'Busy' },
  { key: 'offline', label: 'Offline' },
  { key: 'independentDriver', label: 'Independent' },
  { key: 'affiliateDriver', label: 'Affiliate Drivers' },
  { key: 'approved', label: 'Approved' },
  { key: 'suspended', label: 'Suspended' },
];

export default function OpsDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [section, setSection] = useState<DriverSection>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDrivers = async () => {
    const result = await opsApi.get<{ success: boolean; data: Driver[] }>('/api/ops/drivers');
    setDrivers(result.data);
  };

  useEffect(() => {
    loadDrivers().catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const visible = drivers.filter(driver => {
    const term = search.toLowerCase();
    const matchesSearch = !term || [driver.fullName, driver.email, driver.affiliate?.companyName]
      .some(value => value?.toLowerCase().includes(term));
    const matchesFilter = section === 'all' || driver.status === section || driver.applicationStatus === section || driver.driverType === section;
    return matchesSearch && matchesFilter;
  });

  const sectionCount = (key: DriverSection) =>
    drivers.filter(driver => key === 'all' || driver.status === key || driver.applicationStatus === key || driver.driverType === key).length;

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading drivers...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Drivers</h1>
        <p className="text-slate-500 text-sm">
          {drivers.filter(driver => driver.status === 'available').length} available - {drivers.length} total
        </p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search driver or affiliate" className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none" />
        </div>
        {SECTIONS.map(({ key, label }) => (
          <button key={key} onClick={() => setSection(key)} className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: section === key ? '#3b82f6' : '#f8fafc', color: section === key ? 'white' : '#64748b' }}>
            {label} <span className="opacity-70">({sectionCount(key)})</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50">
            {['Driver', 'Type / Affiliate', 'Contact', 'Application', 'Documents', 'Work Status', 'Rating', 'Rides', 'Details'].map(header => <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{header}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map(driver => (
              <tr key={driver.id}>
                <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold">{driver.fullName.charAt(0)}</div><span className="font-semibold text-sm">{driver.fullName}</span></div></td>
                <td className="px-4 py-4"><p className="text-xs font-semibold">{driver.driverType === 'affiliateDriver' ? 'Affiliate Driver' : 'Independent Driver'}</p><p className="text-xs text-slate-400">{driver.affiliate?.companyName ?? 'Direct Ride Prestige driver'}</p></td>
                <td className="px-4 py-4"><p className="text-sm">{driver.email}</p><p className="text-xs text-slate-400">{driver.phone}</p></td>
                <td className="px-4 py-4"><span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${driver.applicationStatus === 'approved' ? 'bg-green-50 text-green-700' : driver.applicationStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{driver.applicationStatus}</span></td>
                <td className="px-4 py-4"><span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${driver.documentsStatus === 'approved' ? 'bg-green-50 text-green-700' : driver.documentsStatus === 'rejected' || driver.documentsStatus === 'expired' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{driver.documentsStatus ?? 'missing'}</span></td>
                <td className="px-4 py-4"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[driver.status] ?? '#94a3b8' }} /><span className="text-xs capitalize">{driver.status}</span></div></td>
                <td className="px-4 py-4"><span className="flex items-center gap-1 text-sm"><Star size={12} className="text-amber-400" />{driver.rating || '-'}</span></td>
                <td className="px-4 py-4 text-sm">{driver.totalJobs}</td>
                <td className="px-4 py-4"><Link href={`/ops/drivers/${driver.id}`} className="text-blue-500"><ArrowRight size={16} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <div className="py-16 text-center text-slate-400">No drivers match this filter.</div>}
      </div>
    </div>
  );
}
