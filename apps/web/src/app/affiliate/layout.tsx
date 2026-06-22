'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Car, Users, History, LogOut, ChevronRight, Building2, Menu, X, Receipt, FileCheck2 } from 'lucide-react';
import { affiliateApi } from '@/lib/api-client';
import BrandLogo from '@/components/common/BrandLogo';
import LocationPermissionGate from '@/components/common/LocationPermissionGate';

const GOLD = '#c9a84c';
const BRAND_BLACK = '#0a0f1e';
const BRAND_GREY = '#8b8fa8';

interface AffiliateIdentity { companyName: string; tradingName: string; email: string; }

const NAV = [
  { label: 'Overview', items: [{ href: '/affiliate/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Rides', items: [{ href: '/affiliate/rides', label: 'Ride Requests', icon: Receipt }, { href: '/affiliate/history', label: 'Ride History', icon: History }] },
  { label: 'My Fleet', items: [{ href: '/affiliate/drivers', label: 'My Drivers', icon: Users }, { href: '/affiliate/vehicles', label: 'My Vehicles', icon: Car }, { href: '/affiliate/documents', label: 'Documents', icon: FileCheck2 }] },
];

function AffNavLinks({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  return (
    <nav className="flex-1 p-3 space-y-5">
      {NAV.map(g => (
        <div key={g.label}>
          <p className="px-3 mb-2 uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.28)', fontSize: '8px', fontWeight: 600, letterSpacing: '0.15em' }}>{g.label}</p>
          <div className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} onClick={onNav} className="admin-sidebar-item" style={{ color: active ? GOLD : '#4b5563', background: active ? 'rgba(201,168,76,0.07)' : 'transparent', border: active ? '1px solid rgba(201,168,76,0.18)' : '1px solid transparent' }}>
                  <Icon size={14} style={{ color: active ? GOLD : '#9ca3af' }} />
                  <span>{label}</span>
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

function AffLogout({ identity }: { identity: AffiliateIdentity | null }) {
  const logout = async () => { await fetch('/api/affiliate/logout', { method: 'POST' }); window.location.href = '/affiliate/login'; };
  const name = identity?.tradingName || identity?.companyName || 'Affiliate';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'A';
  return (
    <div className="p-4" style={{ borderTop: '1px solid #f0f0f0' }}>
      <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(201,168,76,0.1)', color: GOLD }}>{initials}</div>
        <div><p className="text-xs font-semibold" style={{ color: BRAND_BLACK }}>{name}</p><p className="text-xs" style={{ color: '#9ca3af', fontSize: '10px' }}>{identity?.email || ''}</p></div>
      </div>
      <Link href="/" className="admin-sidebar-item mb-1" style={{ color: '#6b7280', border: '1px solid transparent' }}><LogOut size={13} /> <span style={{ fontSize: '0.75rem' }}>View public site</span></Link>
      <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-50 transition-all bg-transparent border-none cursor-pointer font-inherit"><LogOut size={13} /> Sign out</button>
    </div>
  );
}

function Sidebar({ onNav, identity }: { onNav?: () => void; identity: AffiliateIdentity | null }) {
  const name = identity?.tradingName || identity?.companyName || 'Loading…';
  return (
    <aside className="w-64 min-h-screen flex flex-col shrink-0 bg-white" style={{ borderRight: '1px solid #e5e7eb' }}>
      <div className="p-6" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <Link href="/affiliate/dashboard" onClick={onNav} className="flex items-center gap-2.5">
          <BrandLogo width={32} />
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-sm" style={{ color: BRAND_BLACK, fontFamily: 'Playfair Display,Georgia,serif' }}>Ride Prestige</span>
            <p style={{ color: GOLD, fontSize: '7px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{name}</p>
          </div>
        </Link>
      </div>
      <Suspense fallback={<div className="flex-1" />}><AffNavLinks onNav={onNav} /></Suspense>
      <Suspense fallback={null}><AffLogout identity={identity} /></Suspense>
    </aside>
  );
}

function AffiliateLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [identity, setIdentity] = useState<AffiliateIdentity | null>(null);
  const isAuthPage = pathname === '/affiliate/login' || pathname === '/affiliate/register';

  useEffect(() => {
    if (isAuthPage) return;
    affiliateApi.get<{ success: boolean; data: AffiliateIdentity }>('/api/affiliate/profile')
      .then(r => setIdentity(r.data))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthPage]);

  if (isAuthPage) return <>{children}</>;
  return (
    <div className="portal-brand flex min-h-screen font-sans" style={{ background: '#f9fafb' }}>
      <div className="hidden lg:flex"><Sidebar identity={identity} /></div>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><div className="absolute left-0 top-0 bottom-0 w-64"><Sidebar onNav={() => setOpen(false)} identity={identity} /></div></div>}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-2"><BrandLogo width={24} /><span className="font-bold text-sm" style={{ color: BRAND_BLACK }}>Affiliate</span></div>
          <button onClick={() => setOpen(!open)} style={{ color: BRAND_GREY }}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocationPermissionGate>
      <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
        <AffiliateLayoutInner>{children}</AffiliateLayoutInner>
      </Suspense>
    </LocationPermissionGate>
  );
}
