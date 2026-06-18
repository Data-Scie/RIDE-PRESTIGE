'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Car, Users, History, LogOut, ChevronRight, Building2, Menu, X, Receipt } from 'lucide-react';
import { affiliateApi } from '@/lib/api-client';

interface AffiliateIdentity { companyName: string; tradingName: string; email: string; }

const NAV = [
  { label: 'Overview', items: [{ href: '/affiliate/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Rides', items: [{ href: '/affiliate/rides', label: 'Ride Requests', icon: Receipt }, { href: '/affiliate/history', label: 'Ride History', icon: History }] },
  { label: 'My Fleet', items: [{ href: '/affiliate/drivers', label: 'My Drivers', icon: Users }, { href: '/affiliate/vehicles', label: 'My Vehicles', icon: Car }] },
];

function AffNavLinks({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  return (
    <nav className="flex-1 p-3 space-y-5">
      {NAV.map(g => (
        <div key={g.label}>
          <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400" style={{ fontSize: '9px' }}>{g.label}</p>
          <div className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} onClick={onNav} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all" style={{ color: active ? '#059669' : '#64748b', background: active ? 'rgba(16,185,129,0.08)' : 'transparent', fontWeight: active ? 600 : 400 }}>
                  <Icon size={15} style={{ color: active ? '#10b981' : '#94a3b8' }} />
                  <span>{label}</span>
                  {active && <ChevronRight size={11} className="ml-auto text-green-400" />}
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
    <div className="p-3" style={{ borderTop: '1px solid #f1f5f9' }}>
      <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#10b981' }}>{initials}</div>
        <div><p className="text-xs font-medium text-slate-700">{name}</p><p className="text-xs text-slate-400" style={{ fontSize: '10px' }}>{identity?.email || ''}</p></div>
      </div>
      <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-50"><LogOut size={13} /> View public site</Link>
      <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-50 transition-all bg-transparent border-none cursor-pointer font-inherit"><LogOut size={13} /> Sign out</button>
    </div>
  );
}

function Sidebar({ onNav, identity }: { onNav?: () => void; identity: AffiliateIdentity | null }) {
  const name = identity?.tradingName || identity?.companyName || 'Loading…';
  return (
    <aside className="w-64 min-h-screen flex flex-col shrink-0 bg-white" style={{ borderRight: '1px solid #f1f5f9' }}>
      <div className="p-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <Link href="/affiliate/dashboard" onClick={onNav} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Building2 size={16} className="text-white" /></div>
          <div><p className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Affiliate Portal</p><p style={{ color: '#10b981', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{name}</p></div>
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
    <div className="flex min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="hidden lg:flex"><Sidebar identity={identity} /></div>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><div className="absolute left-0 top-0 bottom-0 w-64"><Sidebar onNav={() => setOpen(false)} identity={identity} /></div></div>}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2"><Building2 size={16} className="text-green-500" /><span className="font-bold text-sm text-slate-800">Affiliate</span></div>
          <button onClick={() => setOpen(!open)} className="text-slate-600">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AffiliateLayoutInner>{children}</AffiliateLayoutInner>
    </Suspense>
  );
}
