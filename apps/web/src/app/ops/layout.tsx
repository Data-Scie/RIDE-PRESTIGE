'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Map, Car, Building2, Users, Receipt,
  Settings, LogOut, ChevronRight, Menu, X,
  Truck, ClipboardCheck, FileText,
} from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';

const GOLD = '#c9a84c';
const BRAND_BLACK = '#0a0f1e';
const BRAND_GREY = '#8b8fa8';

const NAV = [
  { label: 'Overview', items: [{ href: '/ops/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Live Operations', items: [{ href: '/ops/map', label: 'Live Map', icon: Map }, { href: '/ops/rides', label: 'All Rides', icon: Receipt }] },
  { label: 'Network', items: [{ href: '/ops/applications', label: 'Applications', icon: ClipboardCheck }, { href: '/ops/affiliates', label: 'Affiliates', icon: Building2 }, { href: '/ops/drivers', label: 'Drivers', icon: Car }, { href: '/ops/vehicles', label: 'Vehicle Approvals', icon: Truck }, { href: '/ops/documents', label: 'Documents', icon: FileText }, { href: '/ops/customers', label: 'Customers', icon: Users }] },
  { label: 'System', items: [{ href: '/ops/settings', label: 'Settings', icon: Settings }] },
];

function OpsNavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  return (
    <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
      {NAV.map(group => (
        <div key={group.label}>
          <p className="px-3 mb-2 uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.28)', fontSize: '8px', fontWeight: 600, letterSpacing: '0.15em' }}>{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} className="admin-sidebar-item" style={{ color: active ? GOLD : '#4b5563', background: active ? 'rgba(201,168,76,0.07)' : 'transparent', border: active ? '1px solid rgba(201,168,76,0.18)' : '1px solid transparent' }}>
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

function OpsLogout() {
  const logout = async () => { await fetch('/api/ops/logout', { method: 'POST' }); window.location.href = '/ops/login'; };
  return (
    <div className="p-4" style={{ borderTop: '1px solid #f0f0f0' }}>
      <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.1)' }}>
          <span className="text-xs font-bold" style={{ color: GOLD }}>OP</span>
        </div>
        <div><p className="text-xs font-semibold" style={{ color: BRAND_BLACK }}>Operations Admin</p><p className="text-xs" style={{ color: '#9ca3af', fontSize: '10px' }}>ops@rideprestige.co.uk</p></div>
      </div>
      <Link href="/" className="admin-sidebar-item mb-1" style={{ color: '#6b7280', border: '1px solid transparent' }}><LogOut size={13} /> <span style={{ fontSize: '0.75rem' }}>View public site</span></Link>
      <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:bg-red-500/10" style={{ color: 'rgba(239,68,68,0.6)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><LogOut size={13} /> Sign out</button>
    </div>
  );
}

function Sidebar({ onNav }: { onNav?: () => void }) {
  return (
    <aside className="w-64 min-h-screen flex flex-col shrink-0" style={{ background: 'white', borderRight: '1px solid #e5e7eb' }}>
      <div className="p-6" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <Link href="/ops/dashboard" onClick={onNav} className="flex items-center gap-2.5">
          <BrandLogo width={32} />
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-sm" style={{ color: BRAND_BLACK, fontFamily: 'Playfair Display,Georgia,serif' }}>Ride Prestige</span>
            <p className="font-semibold uppercase" style={{ color: GOLD, fontSize: '7px', letterSpacing: '0.15em' }}>Operations Portal</p>
          </div>
        </Link>
      </div>
      <Suspense fallback={<div className="flex-1" />}><OpsNavLinks /></Suspense>
      <Suspense fallback={null}><OpsLogout /></Suspense>
    </aside>
  );
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthPage = pathname === '/ops/login';
  if (isAuthPage) return <>{children}</>;
  return (
    <div className="portal-brand flex min-h-screen font-sans" style={{ background: '#f9fafb' }}>
      <div className="hidden lg:flex"><Sidebar /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64"><Sidebar onNav={() => setMobileOpen(false)} /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3" style={{ background: 'white', borderBottom: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-2"><BrandLogo width={24} /><span className="font-bold text-sm" style={{ color: BRAND_BLACK }}>Operations</span></div>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: BRAND_GREY }}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Suspense fallback={<div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-amber-100 border-t-brand-gold rounded-full animate-spin" /></div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
