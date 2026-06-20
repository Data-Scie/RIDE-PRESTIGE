'use client';

import { AlertCircle, LogIn, Shield } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';

export const GOLD = '#c9a84c';
export const NAVY = '#0a0f1e';

export const portalInputStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e5e7eb',
  color: NAVY,
  fontFamily: 'inherit',
};

export const portalInputFocusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = GOLD;
    e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)';
    e.target.style.background = 'white';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#e5e7eb';
    e.target.style.boxShadow = 'none';
    e.target.style.background = '#f8fafc';
  },
};

export function PortalLoginShell({
  title, subtitle, badgeLabel, error, onSubmit, children, footer,
}: {
  title: string;
  subtitle: string;
  badgeLabel: string;
  error?: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#f8fafc' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,168,76,0.06) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(201,168,76,0.04) 0%, transparent 50%)' }} />
      <div className="relative w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <BrandLogo width={56} className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: NAVY }}>{title}</h1>
          <p className="text-slate-500 text-sm">{subtitle}</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <Shield size={11} style={{ color: GOLD }} />
            <span style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{badgeLabel}</span>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertCircle size={14} className="shrink-0" style={{ color: '#ef4444' }} />
              <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">{children}</form>
        </div>

        {footer && <p className="text-center text-sm text-slate-500 mt-6">{footer}</p>}
      </div>
    </div>
  );
}

export function PortalSubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all mt-2"
      style={{
        background: loading ? '#e5c878' : 'linear-gradient(135deg,#c9a84c,#e8c96d,#a07c30)',
        color: '#000000',
        boxShadow: loading ? 'none' : '0 4px 20px rgba(201,168,76,0.25)',
        cursor: loading ? 'wait' : 'pointer',
        border: 'none',
        fontFamily: 'inherit',
      }}>
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
          {loadingLabel}
        </span>
      ) : (
        <><LogIn size={15} /> {label}</>
      )}
    </button>
  );
}
