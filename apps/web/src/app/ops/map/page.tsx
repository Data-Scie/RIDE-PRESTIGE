'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Car, MapPin, RefreshCw, Route, Users } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: Record<string, unknown>) => { setCenter(position: Position): void };
        Marker: new (options: Record<string, unknown>) => unknown;
        SymbolPath: { CIRCLE: number };
      };
    };
    initOpsMap: () => void;
  }
}

interface Position {
  lat: number;
  lng: number;
}

interface Driver {
  id: string;
  fullName: string;
  phone: string;
  status: string;
  driverType: 'affiliateDriver' | 'independentDriver';
  applicationStatus: string;
  latitude?: number | null;
  longitude?: number | null;
  lastLocationUpdate?: string | null;
  affiliate?: { companyName: string } | null;
}

interface Ride {
  id: string;
  bookingRef: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  assignedDriverId?: string | null;
}

const ACTIVE_STATUSES = new Set([
  'awaiting_affiliate', 'needs_allocation', 'driver_assigned', 'vehicle_assigned',
  'driver_accepted', 'on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress',
]);

export default function OpsMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [filter, setFilter] = useState<'all' | 'independent' | 'affiliate'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const load = async () => {
    setError('');
    try {
      const [driverResult, rideResult] = await Promise.all([
        opsApi.get<{ data: Driver[] }>('/api/ops/drivers'),
        opsApi.get<{ data: Ride[] }>('/api/ops/rides'),
      ]);
      setDrivers(driverResult.data);
      setRides(rideResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load live operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const approvedDrivers = useMemo(
    () => drivers.filter(driver =>
      driver.applicationStatus === 'approved'
      && (filter === 'all'
        || (filter === 'independent' && driver.driverType === 'independentDriver')
        || (filter === 'affiliate' && driver.driverType === 'affiliateDriver'))),
    [drivers, filter],
  );
  const locatedDrivers = approvedDrivers.filter(driver =>
    typeof driver.latitude === 'number' && typeof driver.longitude === 'number');
  const activeRides = rides.filter(ride => ACTIVE_STATUSES.has(ride.status));

  useEffect(() => {
    if (!apiKey || !mapRef.current || !locatedDrivers.length) return;

    const initialise = () => {
      if (!mapRef.current || !window.google?.maps) return;
      const first = locatedDrivers[0];
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: first.latitude, lng: first.longitude },
        zoom: 12,
      });
      locatedDrivers.forEach(driver => {
        new window.google.maps.Marker({
          position: { lat: driver.latitude, lng: driver.longitude },
          map,
          title: driver.fullName,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: driver.status === 'busy' ? '#10b981' : '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
      });
    };

    if (window.google?.maps) {
      initialise();
      return;
    }
    window.initOpsMap = initialise;
    const existing = document.querySelector('script[data-ops-google-map]');
    if (!existing) {
      const script = document.createElement('script');
      script.dataset.opsGoogleMap = 'true';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initOpsMap`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, [apiKey, locatedDrivers]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Live Operations Map</h1>
          <p className="text-sm text-slate-500">Live driver positions and active rides from the operations API</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary icon={Users} label="Approved drivers" value={drivers.filter(driver => driver.applicationStatus === 'approved').length} />
        <Summary icon={MapPin} label="Sharing GPS" value={drivers.filter(driver => typeof driver.latitude === 'number' && typeof driver.longitude === 'number').length} />
        <Summary icon={Route} label="Active rides" value={activeRides.length} />
      </div>

      <div className="flex gap-2">
        {(['all', 'independent', 'affiliate'] as const).map(option => (
          <button key={option} onClick={() => setFilter(option)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize ${filter === option ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
            {option === 'all' ? 'All drivers' : option}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="relative min-h-[520px] overflow-hidden rounded-2xl bg-slate-900">
          {apiKey && locatedDrivers.length ? (
            <div ref={mapRef} className="absolute inset-0" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <MapPin size={42} className="mb-4 text-blue-400" />
              <p className="font-semibold text-white">
                {!apiKey ? 'Google Maps API key required' : 'No drivers are sharing a GPS position'}
              </p>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                {!apiKey
                  ? 'Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to display real driver markers.'
                  : 'The map will populate automatically when an approved driver sends a location update.'}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">Live drivers ({approvedDrivers.length})</div>
            <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
              {approvedDrivers.map(driver => (
                <div key={driver.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${driver.status === 'available' ? 'bg-emerald-500' : driver.status === 'busy' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{driver.fullName}</p>
                    <p className="truncate text-xs text-slate-400">{driver.affiliate?.companyName ?? 'Independent driver'}</p>
                  </div>
                  <span className="text-xs capitalize text-slate-500">{driver.status}</span>
                </div>
              ))}
              {!approvedDrivers.length && <p className="px-4 py-8 text-center text-sm text-slate-400">No live drivers</p>}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">Active rides ({activeRides.length})</div>
            <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {activeRides.map(ride => (
                <div key={ride.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-700">{ride.bookingRef}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold capitalize text-blue-700">{ride.status.replaceAll('_', ' ')}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-700">{ride.customerName}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{ride.pickupAddress} to {ride.dropoffAddress}</p>
                </div>
              ))}
              {!activeRides.length && <p className="px-4 py-8 text-center text-sm text-slate-400">No active rides</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={18} /></div>
      <div><p className="text-xl font-bold text-slate-800">{value}</p><p className="text-xs text-slate-400">{label}</p></div>
    </div>
  );
}
