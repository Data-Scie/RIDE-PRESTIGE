'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import type { NavigationItem, SiteSettings } from '@/types';

export default function Header({ navigation, settings }: { navigation: NavigationItem[]; settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const nav = navigation.filter(item => item.visible).sort((a, b) => a.order - b.order);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <Link href="/" className="shrink-0">
            <BrandLogo width={90} alt={settings.siteName} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {nav.map(item => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 rounded-lg text-sm transition-all duration-150"
                  style={{
                    color: active ? '#000000' : '#6b7280',
                    fontWeight: active ? 600 : 400,
                    background: active ? 'rgba(0,0,0,0.04)' : 'transparent',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="hidden md:block">
            <Link
              href="/book"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-80"
              style={{ background: '#000000', color: '#ffffff' }}
            >
              Book Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg"
            style={{ color: '#000000' }}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="px-4 py-4 space-y-1">
            {nav.map(item => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ color: active ? '#000000' : '#6b7280', fontWeight: active ? 600 : 400 }}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2">
              <Link
                href="/book"
                onClick={() => setOpen(false)}
                className="block text-center text-sm font-semibold px-5 py-3 rounded-xl"
                style={{ background: '#000000', color: '#ffffff' }}
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
