'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Navigation2, Car, Tag, HelpCircle,
  CalendarCheck, FileBarChart, Headphones, Settings, LogOut,
  ChevronRight, DollarSign, RotateCcw, Phone, Truck,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [{ href:'/admin/dashboard', label:'Dashboard', icon:LayoutDashboard }],
  },
  {
    label: 'Content',
    items: [
      { href:'/admin/content',    label:'Page Content',  icon:FileText },
      { href:'/admin/navigation', label:'Navigation',    icon:Navigation2 },
      { href:'/admin/vehicles',   label:'Vehicles',       icon:Truck },
      { href:'/admin/fleet',      label:'Fleet Categories', icon:Car },
      { href:'/admin/promotions', label:'Promotions',    icon:Tag },
      { href:'/admin/faqs',       label:'FAQs',          icon:HelpCircle },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href:'/admin/bookings', label:'Bookings',       icon:CalendarCheck },
      { href:'/admin/quotes',   label:'Quotes',         icon:FileBarChart },
      { href:'/admin/support',  label:'Support Tickets',icon:Headphones },
    ],
  },
  {
    label: 'System',
    items: [
      { href:'/admin/pricing',  label:'Pricing Manager', icon:DollarSign },
      { href:'/admin/refund',   label:'Refund Policy',   icon:RotateCcw },
      { href:'/admin/contact-settings', label:'Contact Settings', icon:Phone },
      { href:'/admin/settings', label:'Site Settings',  icon:Settings },
    ],
  },
];

const GOLD = '#c9a84c';
const BLACK = '#000000';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === '/admin/dashboard'
      ? pathname === '/admin/dashboard' || pathname === '/admin'
      : pathname.startsWith(href);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <aside
      className="w-64 min-h-screen flex flex-col shrink-0"
      style={{ background: BLACK, borderRight:'1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="p-6" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background:'linear-gradient(135deg,#c9a84c,#e8c96d,#a07c30)', boxShadow:'0 4px 24px rgba(201,168,76,0.2)' }}>
            <span style={{ color:BLACK, fontFamily:'Georgia,serif', fontWeight:700, fontSize:'12px' }}>RP</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-sm text-white" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Ride Prestige</span>
            <span className="font-semibold uppercase" style={{ color:GOLD, fontSize:'7px', letterSpacing:'0.15em' }}>Admin CMS</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="uppercase tracking-widest px-3 mb-2"
              style={{ fontSize:'8px', fontWeight:600, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon:Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} className="admin-sidebar-item"
                    style={{
                      color: active ? GOLD : 'rgba(255,255,255,0.5)',
                      background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                      border: active ? '1px solid rgba(201,168,76,0.18)' : '1px solid transparent',
                    }}>
                    <Icon size={14} style={{ color: active ? GOLD : 'rgba(255,255,255,0.3)' }} />
                    <span style={{ fontSize:'0.8rem' }}>{label}</span>
                    {active && <ChevronRight size={11} className="ml-auto" style={{ color:'rgba(201,168,76,0.5)' }} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background:'rgba(201,168,76,0.12)' }}>
            <span className="text-xs font-bold" style={{ color:GOLD }}>AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">Admin</p>
            <p className="truncate" style={{ color:'rgba(255,255,255,0.3)', fontSize:'9px' }}>admin@rideprestige.co.uk</p>
          </div>
        </div>
        <Link href="/" className="admin-sidebar-item mb-1"
          style={{ color:'rgba(255,255,255,0.35)', border:'1px solid transparent' }}>
          <LogOut size={13} />
          <span style={{ fontSize:'0.75rem' }}>View public site</span>
        </Link>
        <button type="button" onClick={handleLogout} className="admin-sidebar-item w-full"
          style={{ color:'rgba(239,68,68,0.6)', border:'1px solid transparent', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>
          <LogOut size={13} />
          <span style={{ fontSize:'0.75rem' }}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
