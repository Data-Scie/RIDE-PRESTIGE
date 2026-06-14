'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Receipt, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import { affiliateApi } from '@/lib/api-client';

interface DashboardData {
  companyName: string; contactPerson: string;
  activeRides: number; availableDrivers: number; totalJobs: number; rating?: number;
  pendingRides: number; pendingRidePreview?: { bookingRef: string; pickupAddress: string; dropoffAddress: string; fareAmount: number };
}
interface RecentJob { id: string; bookingRef: string; status: string; pickupAddress: string; dropoffAddress: string; fareAmount: number; }
interface Driver { id: string; fullName: string; status: string; licencePlate?: string; }

export default function AffiliateDashboard() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [rides, setRides]     = useState<RecentJob[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchData = () =>
    Promise.all([
      affiliateApi.get<{ success: boolean; data: DashboardData }>('/api/affiliate/dashboard'),
      affiliateApi.get<{ success: boolean; data: RecentJob[] }>('/api/affiliate/jobs/accepted').catch(() => ({ data: [] as RecentJob[] })),
      affiliateApi.get<{ success: boolean; data: Driver[] }>('/api/affiliate/drivers').catch(() => ({ data: [] as Driver[] })),
    ])
      .then(([d, r, dr]) => { setData(d.data); setRides((r as { data: RecentJob[] }).data.slice(0, 5)); setDrivers((dr as { data: Driver[] }).data.slice(0, 5)); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading dashboard…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}. Is the backend running?</div>;
  if (!data)   return null;

  const STATUS_DOT: Record<string, string> = { available: '#10b981', busy: '#3b82f6', offline: '#94a3b8' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Welcome back, {data.contactPerson}</h1>
        <p className="text-slate-500 text-sm">{data.companyName} · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {data.pendingRides > 0 && data.pendingRidePreview && (
        <Link href="/affiliate/rides" className="block p-4 rounded-2xl border-2 border-green-300 animate-pulse" style={{ background: 'rgba(16,185,129,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Receipt size={18} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-green-800">{data.pendingRides} New Ride Request{data.pendingRides > 1 ? 's' : ''} Waiting!</p>
              <p className="text-sm text-green-700">{data.pendingRidePreview.pickupAddress} → {data.pendingRidePreview.dropoffAddress} · £{data.pendingRidePreview.fareAmount}</p>
            </div>
            <ArrowRight size={18} className="text-green-600" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Rides',       value: data.activeRides,      icon: Receipt,   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Available Drivers',  value: data.availableDrivers, icon: Users,     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Total Rides',        value: data.totalJobs,        icon: CheckCircle,color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { label: 'Rating',             value: data.rating ?? '—',    icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">My Drivers</h2>
            <Link href="/affiliate/drivers" className="text-xs text-green-500 font-medium flex items-center gap-1">Manage <ArrowRight size={11} /></Link>
          </div>
          <div className="divide-y divide-slate-50">
            {drivers.length === 0 && <p className="px-5 py-8 text-center text-slate-400 text-sm">No drivers yet</p>}
            {drivers.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: STATUS_DOT[d.status] ?? '#94a3b8' }}>{d.fullName.charAt(0)}</div>
                <div className="flex-1"><p className="text-sm font-medium text-slate-800">{d.fullName}</p><p className="text-xs text-slate-400">{d.licencePlate || ''}</p></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[d.status] ?? '#94a3b8' }} /><span className="text-xs capitalize" style={{ color: STATUS_DOT[d.status] ?? '#94a3b8' }}>{d.status}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Rides</h2>
            <Link href="/affiliate/history" className="text-xs text-green-500 font-medium flex items-center gap-1">All history <ArrowRight size={11} /></Link>
          </div>
          <div className="divide-y divide-slate-50">
            {rides.length === 0 && <p className="px-5 py-8 text-center text-slate-400 text-sm">No rides yet</p>}
            {rides.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.status === 'completed' ? '#6b7280' : '#10b981' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-semibold text-slate-700">{r.bookingRef}</p>
                  <p className="text-xs text-slate-400 truncate">{r.pickupAddress}</p>
                </div>
                <p className="font-semibold text-slate-800 text-sm shrink-0">£{r.fareAmount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
