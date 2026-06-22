'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import { getPortalToken } from '@/lib/api-client';
import LocationPermissionGate from '@/components/common/LocationPermissionGate';

const BLACK = '#0a0f1e';
const CHARCOAL = '#1a1f2e';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/book';
  const { status: sessionStatus } = useSession();
  const [bridging, setBridging] = useState(false);

  // After a real OAuth round-trip, NextAuth lands back on this exact page (not the final
  // protected destination) so CustomerSessionBridge - mounted globally - has a chance to set
  // the rp_customer_jwt cookie client-side before we navigate into a middleware-gated route
  // like /account. Navigating straight there from the OAuth callback would otherwise race the
  // cookie write and bounce back to login.
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    setBridging(true);
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (getPortalToken('customer') || attempts > 20) {
        clearInterval(interval);
        router.push(redirect);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [sessionStatus, redirect, router]);

  const handleContinueAsGuest = () => {
    router.push(redirect.startsWith('/account') ? '/book' : redirect);
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: `/login?redirect=${encodeURIComponent(redirect)}` });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: BLACK }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 mb-8 mx-auto text-xs transition-opacity hover:opacity-60" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <ArrowLeft size={12} /> Back
          </button>
          <BrandLogo width={39} className="mx-auto mb-5" />
          <h1
            style={{
              fontFamily: 'Playfair Display,Georgia,serif',
              color: 'white',
              fontSize: '1.55rem',
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Sign in to continue
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.825rem', marginTop: '6px' }}>
            Fast, secure access to your booking
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: CHARCOAL,
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
            style={{ background: 'linear-gradient(90deg,#c9a84c,#e8c96d,#a07c30)' }} />

          {bridging ? (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)' }}>
                <CheckCircle size={30} className="text-green-400" />
              </div>
              <p className="text-white font-semibold">Verified! Redirecting&hellip;</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl font-medium text-sm transition-all"
                style={{
                  background: 'white',
                  color: '#374151',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* Guest */}
              <button
                onClick={handleContinueAsGuest}
                className="w-full py-3 text-sm transition-opacity hover:opacity-70"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Continue as guest &rarr;
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.15)' }}>
          By continuing you agree to our{' '}
          <a href="/terms" style={{ color: 'rgba(255,255,255,0.3)' }}>Terms</a> &amp;{' '}
          <a href="/privacy-policy" style={{ color: 'rgba(255,255,255,0.3)' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <LocationPermissionGate>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}>
          <div className="w-10 h-10 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </LocationPermissionGate>
  );
}
