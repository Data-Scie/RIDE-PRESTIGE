'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Navigation, History, TrendingUp, LogOut, Car } from 'lucide-react';

const NAV = [
  { href: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/driver/ride', label: 'Active Ride', icon: Navigation },
  { href: '/driver/earnings', label: 'Earnings', icon: TrendingUp },
  { href: '/driver/history', label: 'History', icon: History },
];

function DriverBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex" style={{ background: '#111', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-all" style={{ color: active ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>
            <Icon size={20} />
            <span style={{ fontSize: '10px', fontWeight: active ? 700 : 400 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DriverLogout() {
  const logout = async () => { await fetch('/api/driver/logout', { method: 'POST' }); window.location.href = '/driver/login'; };
  return (
    <button onClick={logout} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors bg-transparent border-none cursor-pointer font-inherit">
      <LogOut size={13} /> Sign out
    </button>
  );
}

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      <header className="flex items-center justify-between px-4 py-3.5" style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Car size={14} className="text-black" /></div>
          <span className="font-bold text-white text-sm" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Driver Portal</span>
        </div>
        <Suspense fallback={null}><DriverLogout /></Suspense>
      </header>
      <main className="flex-1 overflow-auto pb-20">
        <Suspense fallback={<div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" /></div>}>
          {children}
        </Suspense>
      </main>
      <Suspense fallback={null}><DriverBottomNav /></Suspense>
    </div>
  );
}
