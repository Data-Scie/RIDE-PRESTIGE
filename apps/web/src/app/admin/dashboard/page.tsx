'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, FileBarChart, Headphones, TrendingUp, Car, Clock, Users, Building2 } from 'lucide-react';
import DashboardCard from '@/components/admin/DashboardCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { getCategoryLabel } from '@/lib/fare';
import Link from 'next/link';
import { adminApi } from '@/lib/api-client';

interface DashboardData {
  totalBookings: number; pendingBookings: number; completedJobs: number; activeJobs: number;
  totalCustomers: number; totalDrivers: number; approvedDrivers: number;
  totalAffiliates: number; approvedAffiliates: number;
  totalRevenue: number; monthRevenue: number;
  totalRpCommission: number; monthRpCommission: number;
  pendingTickets: number; fleetVehicles: number; websiteFleetVehicles?: number; operationalFleetVehicles?: number;
}

interface RecentBooking {
  id: string; reference: string; status: string;
  customer: { fullName?: string; email?: string } | null;
  journey: { pickupPostcode?: string; dropoffPostcode?: string } | null;
  vehicleCategory: string;
}

interface RecentTicket { id: string; subject: string; status: string; customer: { name?: string } | null; }

export default function AdminDashboard() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [bookings, setBookings] = useState<RecentBooking[]>([]);
  const [tickets, setTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchData = () =>
    Promise.all([
      adminApi.get<{ success: boolean; data: DashboardData }>('/api/admin/dashboard'),
      adminApi.get<{ success: boolean; data: RecentBooking[] }>('/api/admin/bookings?limit=5'),
      adminApi.get<{ success: boolean; data: RecentTicket[] }>('/api/admin/support?limit=5'),
    ])
      .then(([d, b, t]) => { setData(d.data); setBookings(b.data); setTickets(t.data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading dashboard…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}. Is the backend running at port 4000?</div>;
  if (!data)   return null;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome */}
      <div className="rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg,#0a0f1e 0%,#1a1f3a 100%)', border: '1px solid rgba(201,168,76,0.12)' }}>
        <div className="absolute -right-8 -top-8 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(201,168,76,0.06)' }} />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#c9a84c' }}>Welcome back</p>
          <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Prestige Admin Panel</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Ride Prestige — live data</p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-xl px-4 py-2.5"
          style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <div className="w-2 h-2 rounded-full animate-pulse bg-green-400" />
          <span className="text-sm font-medium" style={{ color: '#4ade80' }}>Live</span>
        </div>
      </div>

      {/* Revenue / ROI strip */}
      <Link href="/admin/finance" className="block rounded-2xl p-5 grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#0d1424 0%,#111827 100%)', border: '1px solid rgba(201,168,76,0.15)' }}>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.6)' }}>RP commission (all time)</p>
          <p className="text-2xl font-semibold text-white">£{data.totalRpCommission.toLocaleString()}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Ride Prestige net income</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.6)' }}>RP commission (this month)</p>
          <p className="text-2xl font-semibold" style={{ color: '#c9a84c' }}>£{data.monthRpCommission.toLocaleString()}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Current calendar month</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(74,222,128,0.5)' }}>Gross turnover (all time)</p>
          <p className="text-2xl font-semibold text-white">£{data.totalRevenue.toLocaleString()}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Total customer fares</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(74,222,128,0.5)' }}>Gross turnover (this month)</p>
          <p className="text-2xl font-semibold" style={{ color: '#4ade80' }}>£{data.monthRevenue.toLocaleString()}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Customer fares this month</p>
        </div>
      </Link>

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total bookings"   value={data.totalBookings}   subtitle={`${data.pendingBookings} pending`}     icon={CalendarCheck} accent="blue"  href="/admin/bookings" />
        <DashboardCard title="Active jobs"      value={data.activeJobs}      subtitle={`${data.completedJobs} completed`}     icon={TrendingUp}    accent="green" href="/admin/bookings" />
        <DashboardCard title="Open tickets"     value={data.pendingTickets}  subtitle="awaiting action"                        icon={Headphones}    accent="red"   href="/admin/support" />
        <DashboardCard title="Website fleet"   value={data.websiteFleetVehicles ?? data.fleetVehicles}   subtitle={`${data.operationalFleetVehicles ?? 0} operational vehicles`} icon={Car}           accent="gold"  href="/admin/fleet" />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Customers"   value={data.totalCustomers}                            subtitle="registered"              icon={Users}     accent="blue"  href="/admin/customers" />
        <DashboardCard title="Drivers"     value={`${data.approvedDrivers}/${data.totalDrivers}`} subtitle="approved / total"         icon={Car}       accent="gold"  href="/admin/drivers" />
        <DashboardCard title="Affiliates"  value={`${data.approvedAffiliates}/${data.totalAffiliates}`} subtitle="approved / total"  icon={Building2} accent="green" href="/admin/affiliates" />
        <DashboardCard title="Completed"   value={data.completedJobs}                             subtitle="rides all time"           icon={Clock}     accent="blue"  href="/admin/bookings?status=completed" />
      </div>

      {/* Recent bookings + tickets */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border:'1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:'1px solid #f9f9f9' }}>
            <h3 className="font-semibold text-base" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>Recent bookings</h3>
            <Link href="/admin/bookings" className="text-xs font-medium" style={{ color:'#c9a84c' }}>View all →</Link>
          </div>
          {bookings.length === 0 && <p className="px-6 py-8 text-sm text-slate-400">No bookings yet.</p>}
          {bookings.map(b => (
            <div key={b.id} className="px-6 py-4 hover:bg-gray-50/50" style={{ borderBottom:'1px solid #f9f9f9' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color:'#0a0f1e' }}>{b.customer?.fullName ?? '—'}</p>
                  <p className="text-xs truncate" style={{ color:'#8b8fa8' }}>
                    {b.journey?.pickupPostcode ?? '?'} → {b.journey?.dropoffPostcode ?? '?'}
                  </p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color:'rgba(139,143,168,0.6)' }}>{b.reference}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={b.status} />
                  <span className="text-xs capitalize" style={{ color:'#8b8fa8' }}>{getCategoryLabel(b.vehicleCategory as never)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border:'1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:'1px solid #f9f9f9' }}>
            <h3 className="font-semibold text-base" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>Support tickets</h3>
            <Link href="/admin/support" className="text-xs font-medium" style={{ color:'#c9a84c' }}>View all →</Link>
          </div>
          {tickets.length === 0 && <p className="px-6 py-8 text-sm text-slate-400">No tickets.</p>}
          {tickets.map(ticket => (
            <div key={ticket.id} className="px-6 py-4 hover:bg-gray-50/50" style={{ borderBottom:'1px solid #f9f9f9' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color:'#0a0f1e' }}>{ticket.subject}</p>
                  <p className="text-xs" style={{ color:'#8b8fa8' }}>{ticket.customer?.name ?? '—'}</p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href:'/admin/bookings', label:'Manage bookings', icon:CalendarCheck },
          { href:'/admin/pricing',  label:'Edit pricing',    icon:TrendingUp },
          { href:'/admin/fleet',    label:'Edit fleet',      icon:Car },
          { href:'/admin/settings', label:'Site settings',   icon:Clock },
        ].map(({ href, label, icon:Icon }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl text-center"
            style={{ border:'1px solid #f0f0f0' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'rgba(201,168,76,0.08)' }}>
              <Icon size={18} style={{ color:'#c9a84c' }} />
            </div>
            <span className="text-xs font-medium" style={{ color:'#1a1f2e' }}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
