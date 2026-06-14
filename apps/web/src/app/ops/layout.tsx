'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Map, Car, Building2, Users, Receipt,
  Settings, LogOut, ChevronRight, Menu, X,
} from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';

const NAV = [
  { label: 'Overview', items: [{ href: '/ops/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Live Operations', items: [{ href: '/ops/map', label: 'Live Map', icon: Map }, { href: '/ops/rides', label: 'All Rides', icon: Receipt }] },
  { label: 'Network', items: [{ href: '/ops/affiliates', label: 'Affiliates', icon: Building2 }, { href: '/ops/drivers', label: 'Driver Applications', icon: Car }, { href: '/ops/customers', label: 'Customers', icon: Users }] },
  { label: 'System', items: [{ href: '/ops/settings', label: 'Settings', icon: Settings }] },
];

function OpsNavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  return (
    <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
      {NAV.map(group => (
        <div key={group.label}>
          <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all" style={{ color: active ? '#60a5fa' : 'rgba(255,255,255,0.45)', background: active ? 'rgba(59,130,246,0.12)' : 'transparent', fontWeight: active ? 600 : 400 }}>
                  <Icon size={15} style={{ color: active ? '#3b82f6' : 'rgba(255,255,255,0.25)' }} />
                  <span>{label}</span>
                  {active && <ChevronRight size={11} className="ml-auto" style={{ color: 'rgba(59,130,246,0.5)' }} />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function OpsLogout() {
  const logout = async () => { await fetch('/api/ops/logout', { method: 'POST' }); window.location.href = '/ops/login'; };
  return (
    <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <span className="text-xs font-bold text-blue-400">OP</span>
        </div>
        <div><p className="text-xs font-medium text-white">Operations Admin</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>ops@rideprestige.co.uk</p></div>
      </div>
      <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}><LogOut size={13} /> View public site</Link>
      <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:bg-red-500/10" style={{ color: 'rgba(239,68,68,0.6)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><LogOut size={13} /> Sign out</button>
    </div>
  );
}

function Sidebar({ onNav }: { onNav?: () => void }) {
  return (
    <aside className="w-64 min-h-screen flex flex-col shrink-0" style={{ background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/ops/dashboard" onClick={onNav} className="flex items-center gap-2.5">
          <BrandLogo variant="mark" width={38} className="shrink-0" />
          <div><p className="font-bold text-white text-sm" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Ride Prestige</p><p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3b82f6', fontSize: '7px' }}>Operations Portal</p></div>
        </Link>
      </div>
      <Suspense fallback={<div className="flex-1" />}><OpsNavLinks /></Suspense>
      <Suspense fallback={null}><OpsLogout /></Suspense>
    </aside>
  );
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen" style={{ background: '#f1f5f9' }}>
      <div className="hidden lg:flex"><Sidebar /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64"><Sidebar onNav={() => setMobileOpen(false)} /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3" style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2"><BrandLogo variant="mark" width={28} /><span className="text-white font-bold text-sm">Operations</span></div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Suspense fallback={<div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" /></div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
