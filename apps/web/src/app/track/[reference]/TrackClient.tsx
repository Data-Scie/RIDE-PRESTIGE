'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Car, CheckCircle, Clock, MapPin, Navigation } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/googleMaps';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface TrackData {
  jobId: string | null;
  status: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  isTrackable?: boolean;
  driver: { fullName: string; latitude: number | null; longitude: number | null; lastLocationUpdate: string | null } | null;
  vehicle: { make: string; model: string; registration: string; colour: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  awaiting_affiliate: 'Finding you a driver',
  needs_allocation: 'Finding you a driver',
  driver_assigned: 'Driver assigned',
  vehicle_assigned: 'Driver assigned',
  driver_accepted: 'Driver is on the way',
  on_route: 'Driver is on the way',
  arrived_pickup: 'Driver has arrived',
  passenger_onboard: 'Ride in progress',
  in_progress: 'Ride in progress',
  completed: 'Ride completed',
  cancelled: 'Ride cancelled',
};

export default function TrackClient({ reference }: { reference: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TrackData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/booking/${reference}/track`, { cache: 'no-store' });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || 'Could not find this booking');
        if (!cancelled) setData(body.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load tracking info');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [reference]);

  const hasPosition = data?.driver && typeof data.driver.latitude === 'number' && typeof data.driver.longitude === 'number';

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current || !hasPosition || !data?.driver) return;
    let cancelled = false;
    loadGoogleMaps(GOOGLE_MAPS_KEY).then(() => {
      if (cancelled || !mapRef.current || !window.google?.maps || !data?.driver) return;
      const position = { lat: data.driver.latitude as number, lng: data.driver.longitude as number };
      const map = new window.google.maps.Map(mapRef.current, { center: position, zoom: 13 });
      new window.google.maps.Marker({
        position,
        map,
        title: data.driver.fullName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#c9a84c',
          fillOpacity: 1,
          strokeColor: '#0a0f1e',
          strokeWeight: 2,
        },
      });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPosition, data?.driver?.latitude, data?.driver?.longitude]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f5f8' }}>
        <div className="w-10 h-10 border-4 border-t-yellow-600 border-yellow-200 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center py-24 px-4" style={{ background: '#f4f5f8' }}>
        <div className="max-w-md w-full card p-10 text-center">
          <p className="font-semibold" style={{ color: '#0a0f1e' }}>{error || 'Booking not found'}</p>
          <Link href="/" className="btn-gold inline-flex items-center justify-center mt-6 px-6 py-3">Back to home</Link>
        </div>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[data.status] ?? data.status.replace(/_/g, ' ');
  const completed = data.status === 'completed';
  const cancelled = data.status === 'cancelled';

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: '#f4f5f8' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest" style={{ color: '#8b8fa8' }}>Booking ref</span>
            <span className="font-mono font-bold text-sm" style={{ color: '#c9a84c' }}>{reference}</span>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-3" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>
            {completed ? <CheckCircle className="text-green-500" /> : cancelled ? <Clock className="text-red-500" /> : <Navigation className="text-blue-500" />}
            {statusLabel}
          </h1>
          {(data.pickupAddress || data.dropoffAddress) && (
            <p className="text-sm mt-2" style={{ color: '#8b8fa8' }}>{data.pickupAddress} &rarr; {data.dropoffAddress}</p>
          )}
        </div>

        {data.driver && (
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>
              {data.driver.fullName.split(' ').map(p => p[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: '#0a0f1e' }}>{data.driver.fullName}</p>
              {data.vehicle && <p className="text-sm flex items-center gap-1.5" style={{ color: '#8b8fa8' }}><Car size={13} /> {data.vehicle.make} {data.vehicle.model} &middot; {data.vehicle.registration}</p>}
            </div>
          </div>
        )}

        {data.isTrackable && (
          <div className="card p-0 overflow-hidden">
            <div className="relative min-h-[400px] bg-slate-900">
              {GOOGLE_MAPS_KEY && hasPosition ? (
                <div ref={mapRef} className="absolute inset-0" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <MapPin size={36} className="mb-3 text-blue-400" />
                  <p className="font-semibold text-white">
                    {!GOOGLE_MAPS_KEY ? 'Live map coming soon' : "Waiting for your driver's location"}
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-slate-400">
                    This page refreshes automatically every few seconds.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="text-sm font-semibold" style={{ color: '#c9a84c' }}>Back to home</Link>
        </div>
      </div>
    </div>
  );
}
