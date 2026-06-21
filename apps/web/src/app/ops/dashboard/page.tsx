'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car, Building2, MapPin, Clock, CheckCircle, AlertCircle, ArrowRight, Navigation } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

const GOLD = '#c9a84c';
const BRAND_BLACK = '#0a0f1e';

interface DashboardData {
  activeRides: number; awaitingAffiliate: number; needsAllocation: number;
  completedToday: number; totalDrivers: number; availableDrivers: number;
  totalAffiliates: number; pendingApprovals: number;
  todayGrossRevenue: number; todayRpCommission: number;
}
interface RecentJob {
  id: string; bookingRef: string; status: string; customerName: string;
  pickupAddress: string; dropoffAddress: string; fareAmount: number; vehicleCategory: string;
}
interface RecentDriver {
  id: string; fullName: string; status: string; email: string;
  isApproved: boolean; rating: number; totalJobs: number;
}

export default function OpsDashboard() {
  const [stats, setStats]     = useState<DashboardData | null>(null);
  const [rides, setRides]     = useState<RecentJob[]>([]);
  const [drivers, setDrivers] = useState<RecentDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchData = () =>
    Promise.all([
      opsApi.get<{ success: boolean; data: DashboardData }>('/api/ops/dashboard'),
      opsApi.get<{ success: boolean; data: RecentJob[] }>('/api/ops/rides'),
      opsApi.get<{ success: boolean; data: RecentDriver[] }>('/api/ops/drivers'),
    ])
      .then(([d, r, dr]) => { setStats(d.data); setRides(r.data.slice(0, 5)); setDrivers(dr.data.slice(0, 5)); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    awaiting_affiliate: '#f59e0b', needs_allocation: '#f59e0b', driver_assigned: '#3b82f6',
    driver_accepted: '#3b82f6', on_route: '#8b5cf6', arrived_pickup: '#8b5cf6',
    in_progress: '#10b981', completed: '#6b7280', cancelled: '#ef4444',
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading dashboard…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}. Is the backend server running at port 4000?</div>;
  if (!stats)  return null;

  const statCards = [
    { label: 'Active Rides',       value: stats.activeRides,      icon: Navigation, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Awaiting Affiliate', value: stats.awaitingAffiliate, icon: Clock,      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Needs Allocation',   value: stats.needsAllocation,   icon: AlertCircle,color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Completed Today',    value: stats.completedToday,    icon: CheckCircle,color: GOLD, bg: 'rgba(201,168,76,0.1)' },
    { label: 'Total Drivers',      value: stats.totalDrivers,      icon: Car,        color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Available Drivers',  value: stats.availableDrivers,  icon: Car,        color: GOLD, bg: 'rgba(201,168,76,0.1)' },
    { label: 'Total Affiliates',   value: stats.totalAffiliates,   icon: Building2,  color: BRAND_BLACK, bg: 'rgba(10,15,30,0.06)' },
    { label: 'Pending Approvals',  value: stats.pendingApprovals,  icon: AlertCircle,color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Operations Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Live overview — Ride Prestige network</p>
        </div>
        <Link href="/ops/map" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: GOLD, color: BRAND_BLACK }}>
          <MapPin size={15} /> Open Live Map
        </Link>
      </div>

      {/* Today's revenue strip */}
      <div className="rounded-2xl p-5 grid grid-cols-2 gap-4"
        style={{ background: 'linear-gradient(135deg,#0d1424 0%,#111827 100%)', border: '1px solid rgba(201,168,76,0.15)' }}>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.7)' }}>RP Commission — Today</p>
          <p className="text-3xl font-bold text-white">£{(stats.todayRpCommission ?? 0).toLocaleString()}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Ride Prestige net income today</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(74,222,128,0.6)' }}>Gross Turnover — Today</p>
          <p className="text-3xl font-bold" style={{ color: '#4ade80' }}>£{(stats.todayGrossRevenue ?? 0).toLocaleString()}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Total customer fares today</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-slate-800 mb-0.5">{value}</p>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Live &amp; Recent Rides</h2>
            <Link href="/ops/rides" className="text-xs font-medium flex items-center gap-1" style={{ color: GOLD }}>View all <ArrowRight size={11} /></Link>
          </div>
          <div className="divide-y divide-slate-50">
            {rides.map(ride => (
              <Link key={ride.id} href={`/ops/rides/${ride.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[ride.status] ?? '#94a3b8' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 text-sm">{ride.bookingRef}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: (STATUS_COLORS[ride.status] ?? '#94a3b8') + '20', color: STATUS_COLORS[ride.status] ?? '#94a3b8' }}>{ride.status.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{ride.customerName} · {ride.pickupAddress}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-700">£{ride.fareAmount}</p>
                  <p className="text-xs text-slate-400 capitalize">{ride.vehicleCategory}</p>
                </div>
              </Link>
            ))}
            {rides.length === 0 && <p className="px-5 py-8 text-center text-slate-400 text-sm">No rides yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Drivers</h2>
            <Link href="/ops/drivers" className="text-xs font-medium flex items-center gap-1" style={{ color: GOLD }}>All <ArrowRight size={11} /></Link>
          </div>
          <div className="divide-y divide-slate-50">
            {drivers.map(d => (
              <Link key={d.id} href={`/ops/drivers/${d.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: d.status === 'busy' ? '#10b981' : d.status === 'available' ? 'rgba(201,168,76,0.14)' : '#f1f5f9', color: d.status === 'available' ? GOLD : d.status === 'busy' ? 'white' : '#94a3b8' }}>
                  {d.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{d.fullName}</p>
                  <p className="text-xs text-slate-500">{d.email}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.status === 'busy' ? '#10b981' : d.status === 'available' ? GOLD : '#94a3b8' }} />
                    <span className="text-xs capitalize" style={{ color: d.status === 'busy' ? '#10b981' : d.status === 'available' ? GOLD : '#94a3b8' }}>{d.status}</span>
                  </div>
                  {!d.isApproved && <span className="text-xs text-amber-500">Pending</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Approvals', desc: `${stats.pendingApprovals} require review`, href: '/ops/applications', color: '#f59e0b', icon: AlertCircle },
          { label: 'Affiliate Network', desc: `${stats.totalAffiliates} affiliates`, href: '/ops/affiliates', color: GOLD, icon: Building2 },
          { label: 'Live Tracking',     desc: 'View all drivers on map', href: '/ops/map', color: BRAND_BLACK, icon: MapPin },
        ].map(({ label, desc, href, color, icon: Icon }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '15' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="font-semibold text-slate-800 text-sm mb-1">{label}</p>
            <p className="text-xs text-slate-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
