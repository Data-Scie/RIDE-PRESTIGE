'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

type PermissionState = 'checking' | 'granted' | 'prompt' | 'denied' | 'unsupported';

const GOLD = '#c9a84c';
const BLACK = '#0a0f1e';

export default function LocationPermissionGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PermissionState>('checking');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState('unsupported');
      return;
    }
    if (!navigator.permissions?.query) {
      // Browsers without the Permissions API (older Safari) - fall back to letting the
      // request itself decide; treat as "prompt" so the Enable button is shown.
      setState('prompt');
      return;
    }
    let status: PermissionStatus | null = null;
    navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(result => {
      status = result;
      setState(result.state as PermissionState);
      result.onchange = () => setState(result.state as PermissionState);
    }).catch(() => setState('prompt'));
    return () => { if (status) status.onchange = null; };
  }, []);

  const requestAccess = () => {
    navigator.geolocation.getCurrentPosition(
      () => setState('granted'),
      () => setState('denied'),
      { timeout: 10000 },
    );
  };

  if (state === 'checking') return null;
  if (state === 'granted' || state === 'unsupported') return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BLACK }}>
      <div className="max-w-sm w-full rounded-3xl p-8 text-center" style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(201,168,76,0.12)' }}>
          <MapPin size={28} style={{ color: GOLD }} />
        </div>
        <h1 className="text-lg font-semibold text-white mb-2">Location access required</h1>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {state === 'denied'
            ? "Location access was denied. Ride Prestige needs this to match you with nearby drivers and accurately track journeys - please enable it in your browser's site settings, then try again."
            : 'Ride Prestige needs your location to match you with nearby drivers, calculate accurate fares, and track journeys in progress.'}
        </p>
        <button
          onClick={requestAccess}
          className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{ background: GOLD, color: BLACK }}
        >
          {state === 'denied' ? 'Try Again' : 'Enable Location'}
        </button>
      </div>
    </div>
  );
}
