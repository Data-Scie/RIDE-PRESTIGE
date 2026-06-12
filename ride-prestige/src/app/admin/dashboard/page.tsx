import { CalendarCheck, FileBarChart, Headphones, TrendingUp, Car, Clock } from 'lucide-react';
import DashboardCard from '@/components/admin/DashboardCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { mockBookings, mockSupportTickets, mockQuotes } from '@/lib/data';
import { getCategoryLabel } from '@/lib/fare';
import Link from 'next/link';

export default function AdminDashboard() {
  const recent = mockBookings.slice(0, 5);
  const openTickets = mockSupportTickets.filter(t => (t.status as string) !== 'resolved');

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome */}
      <div className="rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
        style={{ background:'#000000' }}>
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full blur-2xl" style={{ background:'rgba(201,168,76,0.05)' }} />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color:'#c9a84c' }}>Welcome back</p>
          <h2 className="text-2xl font-semibold text-white" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Ride Prestige CMS</h2>
          <p className="text-sm mt-1" style={{ color:'rgba(255,255,255,0.4)' }}>Admin panel &mdash; all systems operational</p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-xl px-4 py-2.5"
          style={{ background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.25)' }}>
          <div className="w-2 h-2 rounded-full animate-pulse bg-green-400" />
          <span className="text-sm font-medium" style={{ color:'#4ade80' }}>Live</span>
        </div>
      </div>

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Bookings today" value={2} subtitle="vs 3 yesterday" icon={CalendarCheck} trend={{ value:'33%', positive:false }} accent="blue" />
        <DashboardCard title="This week" value={14} subtitle="total bookings" icon={TrendingUp} trend={{ value:'12%', positive:true }} accent="green" />
        <DashboardCard title="Pending quotes" value={mockQuotes.filter(q => (q.status as string) === 'pending').length} subtitle="awaiting action" icon={FileBarChart} accent="gold" />
        <DashboardCard title="Open tickets" value={openTickets.length} subtitle="support requests" icon={Headphones} accent="red" />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="This month" value={47} subtitle="total bookings" icon={CalendarCheck} accent="blue" />
        <DashboardCard title="Revenue (est.)" value="£12,840" subtitle="this month" icon={TrendingUp} trend={{ value:'8%', positive:true }} accent="green" />
        <DashboardCard title="Top vehicle" value="Prestige" subtitle="most booked" icon={Car} accent="gold" />
        <DashboardCard title="Avg. response" value="18 min" subtitle="quote turnaround" icon={Clock} accent="blue" />
      </div>

      {/* Recent bookings + tickets */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border:'1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:'1px solid #f9f9f9' }}>
            <h3 className="font-semibold text-base" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>Recent bookings</h3>
            <Link href="/admin/bookings" className="text-xs font-medium" style={{ color:'#c9a84c' }}>View all &rarr;</Link>
          </div>
          {recent.map(b => (
            <div key={b.id} className="px-6 py-4 hover:bg-gray-50/50" style={{ borderBottom:'1px solid #f9f9f9' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color:'#0a0f1e' }}>{b.customer.fullName}</p>
                  <p className="text-xs truncate" style={{ color:'#8b8fa8' }}>{b.journey.pickupPostcode} &rarr; {b.journey.dropoffPostcode}</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color:'rgba(139,143,168,0.6)' }}>{b.reference}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={b.status} />
                  <span className="text-xs capitalize" style={{ color:'#8b8fa8' }}>{getCategoryLabel(b.vehicleCategory)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border:'1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:'1px solid #f9f9f9' }}>
            <h3 className="font-semibold text-base" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>Support tickets</h3>
            <Link href="/admin/support" className="text-xs font-medium" style={{ color:'#c9a84c' }}>View all &rarr;</Link>
          </div>
          {mockSupportTickets.map(ticket => (
            <div key={ticket.id} className="px-6 py-4 hover:bg-gray-50/50" style={{ borderBottom:'1px solid #f9f9f9' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color:'#0a0f1e' }}>{ticket.subject}</p>
                  <p className="text-xs" style={{ color:'#8b8fa8' }}>{ticket.customer.name}</p>
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
