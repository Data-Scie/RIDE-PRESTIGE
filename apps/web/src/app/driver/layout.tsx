'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight, History, LayoutDashboard, LogOut,
  Menu, Navigation, TrendingUp, X,
  ShieldCheck,
} from 'lucide-react';
import { driverApi } from '@/lib/api-client';
import BrandLogo from '@/components/common/BrandLogo';

interface DriverIdentity {
  fullName: string;
  email: string;
  status: string;
  driverType: 'affiliateDriver' | 'independentDriver';
  affiliate?: { companyName: string; tradingName?: string } | null;
}

const NAV = [
  { label: 'Overview', items: [{ href: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Work', items: [{ href: '/driver/ride', label: 'Active Ride', icon: Navigation }, { href: '/driver/history', label: 'Ride History', icon: History }, { href: '/driver/compliance', label: 'Compliance & Vehicle', icon: ShieldCheck }] },
  { label: 'Finance', items: [{ href: '/driver/earnings', label: 'Earnings', icon: TrendingUp }] },
];

function DriverNav({ profile, onNav }: { profile: DriverIdentity | null; onNav?: () => void }) {
  const pathname = usePathname();
  const groups = NAV.filter(group => profile?.driverType === 'affiliateDriver' ? group.label !== 'Finance' : true);
  return (
    <nav className="flex-1 p-3 space-y-5">
      {groups.map(group => (
        <div key={group.label}>
          <p className="px-3 mb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-400">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} onClick={onNav} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <Icon size={15} className={active ? 'text-blue-600' : 'text-slate-400'} />
                  {label}
                  {active && <ChevronRight size={11} className="ml-auto text-blue-400" />}
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
    <div className="p-3 border-t border-slate-100">
      <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-600">{initials}</div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate">{profile?.fullName || 'Driver'}</p>
          <p className="text-[10px] text-slate-400 truncate">{profile?.email || 'Loading account...'}</p>
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
    <aside className="w-64 min-h-screen flex flex-col shrink-0 bg-white border-r border-slate-100">
      <div className="p-5 border-b border-slate-100">
        <Link href="/driver/dashboard" onClick={onNav} className="flex flex-col gap-2">
          <BrandLogo variant="full" width={138} />
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm">Driver Portal</p>
            <p className="text-blue-600 text-[9px] font-bold tracking-widest uppercase truncate">{company}</p>
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
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:flex"><Sidebar profile={profile} /></div>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><div className="absolute left-0 top-0 bottom-0 w-64"><Sidebar profile={profile} onNav={() => setOpen(false)} /></div></div>}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2"><BrandLogo variant="mark" width={28} /><div><p className="font-bold text-sm text-slate-800">{profile?.fullName || 'Driver Portal'}</p><p className="text-[10px] text-slate-400">{profile?.email}</p></div></div>
          <button onClick={() => setOpen(!open)} className="text-slate-600">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-slate-50" />}><DriverLayoutInner>{children}</DriverLayoutInner></Suspense>;
}
