'use client';

import { useEffect, useState } from 'react';
import { affiliateApi } from '@/lib/api-client';

interface Driver {
  id: string; fullName: string; email: string; phone: string;
  status: string; totalJobs?: number; isApproved?: boolean;
  applicationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
}

const STATUS_COLOR: Record<string, string> = { available: '#10b981', busy: '#3b82f6', offline: '#94a3b8' };

export default function AffiliateDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    affiliateApi.get<{ success: boolean; data: Driver[] }>('/api/affiliate/drivers')
      .then(result => setDrivers(result.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading drivers...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Drivers</h1>
        <p className="text-slate-500 text-sm">{drivers.length} registered · {drivers.filter(driver => driver.status === 'available' && driver.isApproved).length} available</p>
        <p className="text-xs text-slate-400 mt-1">Drivers join your fleet by selecting your company on the shared driver application form.</p>
      </div>
      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
        {drivers.map(driver => {
          const applicationStatus = driver.applicationStatus ?? (driver.isApproved ? 'approved' : 'pending');
          return (
            <div key={driver.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: STATUS_COLOR[driver.status] ?? '#94a3b8' }}>{driver.fullName.charAt(0)}</div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{driver.fullName}</p>
                <p className="text-xs text-slate-400">{driver.email} · {driver.phone}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${applicationStatus === 'approved' ? 'bg-green-50 text-green-700' : applicationStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{applicationStatus}</span>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[driver.status] ?? '#94a3b8' }} /><span className="text-xs capitalize text-slate-500">{driver.status}</span></div>
                <p className="text-xs text-slate-400 mt-1">{driver.totalJobs ?? 0} jobs</p>
              </div>
            </div>
          );
        })}
        {!drivers.length && <p className="py-12 text-center text-slate-400 text-sm">No drivers have selected your affiliate yet.</p>}
      </div>
    </div>
  );
}
