'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell, ChevronRight, History, LayoutDashboard, LogOut,
  Menu, Navigation, TrendingUp, X,
  ShieldCheck,
} from 'lucide-react';
import { driverApi } from '@/lib/api-client';
import BrandLogo from '@/components/common/BrandLogo';
import LocationPermissionGate from '@/components/common/LocationPermissionGate';

const GOLD = '#c9a84c';
const BRAND_BLACK = '#0a0f1e';
const BRAND_GREY = '#8b8fa8';

interface DriverIdentity {
  fullName: string;
  email: string;
  status: string;
  driverType: 'affiliateDriver' | 'independentDriver';
  affiliate?: { companyName: string; tradingName?: string } | null;
}

const NAV = [
  { label: 'Overview', items: [{ href: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Work', items: [{ href: '/driver/requests', label: 'Ride Requests', icon: Bell }, { href: '/driver/ride', label: 'Active Ride', icon: Navigation }, { href: '/driver/history', label: 'Ride History', icon: History }, { href: '/driver/compliance', label: 'Compliance & Vehicle', icon: ShieldCheck }] },
  { label: 'Finance', items: [{ href: '/driver/earnings', label: 'Earnings', icon: TrendingUp }] },
];

function DriverNav({ profile, onNav }: { profile: DriverIdentity | null; onNav?: () => void }) {
  const pathname = usePathname();
  const groups = NAV.filter(group => profile?.driverType === 'affiliateDriver' ? group.label !== 'Finance' : true);
  return (
    <nav className="flex-1 p-3 space-y-5">
      {groups.map(group => (
        <div key={group.label}>
          <p className="px-3 mb-2 uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.28)', fontSize: '8px', fontWeight: 600, letterSpacing: '0.15em' }}>{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} onClick={onNav} className="admin-sidebar-item" style={{ color: active ? GOLD : '#4b5563', background: active ? 'rgba(201,168,76,0.07)' : 'transparent', border: active ? '1px solid rgba(201,168,76,0.18)' : '1px solid transparent' }}>
                  <Icon size={14} style={{ color: active ? GOLD : '#9ca3af' }} />
                  {label}
                  {active && <ChevronRight size={11} className="ml-auto" style={{ color: 'rgba(201,168,76,0.5)' }} />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function DriverAccount({ profile }: { profile: DriverIdentity | null }) {
  const logout = async () => {
    await fetch('/api/driver/logout', { method: 'POST' });
    window.location.href = '/driver/login';
  };
  const initials = profile?.fullName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'DR';
  return (
    <div className="p-4" style={{ borderTop: '1px solid #f0f0f0' }}>
      <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(201,168,76,0.1)', color: GOLD }}>{initials}</div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: BRAND_BLACK }}>{profile?.fullName || 'Driver'}</p>
          <p className="text-[10px] truncate" style={{ color: '#9ca3af' }}>{profile?.email || 'Loading account...'}</p>
        </div>
      </div>
      <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50"><LogOut size={13} /> Sign out</button>
    </div>
  );
}

function Sidebar({ profile, onNav }: { profile: DriverIdentity | null; onNav?: () => void }) {
  const company = profile?.driverType === 'affiliateDriver'
    ? profile.affiliate?.tradingName || profile.affiliate?.companyName || 'Affiliate Fleet'
    : 'Ride Prestige Network';
  return (
    <aside className="w-64 min-h-screen flex flex-col shrink-0 bg-white" style={{ borderRight: '1px solid #e5e7eb' }}>
      <div className="p-6" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <Link href="/driver/dashboard" onClick={onNav} className="flex items-center gap-2.5">
          <BrandLogo width={32} />
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{ color: BRAND_BLACK, fontFamily: 'Playfair Display,Georgia,serif' }}>Ride Prestige</p>
            <p className="text-[7px] font-semibold tracking-widest uppercase truncate" style={{ color: GOLD, letterSpacing: '0.15em' }}>{company}</p>
          </div>
        </Link>
      </div>
      <DriverNav profile={profile} onNav={onNav} />
      <DriverAccount profile={profile} />
    </aside>
  );
}

function DriverLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<DriverIdentity | null>(null);
  const isAuthPage = pathname === '/driver/login' || pathname === '/driver/register';

  useEffect(() => {
    if (!isAuthPage) {
      driverApi.get<{ success: boolean; data: DriverIdentity }>('/api/driver/profile')
        .then(result => setProfile(result.data))
        .catch(() => {});
    }
  }, [isAuthPage]);

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="portal-brand flex min-h-screen font-sans" style={{ background: '#f9fafb' }}>
      <div className="hidden lg:flex"><Sidebar profile={profile} /></div>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><div className="absolute left-0 top-0 bottom-0 w-64"><Sidebar profile={profile} onNav={() => setOpen(false)} /></div></div>}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-2 min-w-0"><BrandLogo width={24} /><div className="min-w-0"><p className="font-bold text-sm truncate" style={{ color: BRAND_BLACK }}>{profile?.fullName || 'Driver Portal'}</p><p className="text-[10px] truncate" style={{ color: BRAND_GREY }}>{profile?.email}</p></div></div>
          <button onClick={() => setOpen(!open)} style={{ color: BRAND_GREY }}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocationPermissionGate>
      <Suspense fallback={<div className="min-h-screen bg-slate-50" />}><DriverLayoutInner>{children}</DriverLayoutInner></Suspense>
    </LocationPermissionGate>
  );
}
