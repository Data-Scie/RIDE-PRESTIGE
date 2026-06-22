'use client';

import { useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin, Pencil, X } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/googleMaps';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface LocationValue {
  address: string;
  latitude?: number;
  longitude?: number;
}

interface LocationPickerProps {
  label: string;
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  placeholder?: string;
  allowCurrentLocation?: boolean;
  error?: string;
}

function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!GOOGLE_MAPS_KEY) return Promise.resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  return fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`)
    .then(res => res.json())
    .then(data => data.results?.[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    .catch(() => `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
}

export default function LocationPicker({ label, value, onChange, placeholder, allowCurrentLocation, error }: LocationPickerProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<InstanceType<Window['google']['maps']['Marker']> | null>(null);

  useEffect(() => {
    if (!mapOpen || !GOOGLE_MAPS_KEY || !mapRef.current) return;
    let cancelled = false;
    const start = {
      lat: value.latitude ?? 53.3811,
      lng: value.longitude ?? -1.4701,
    };
    loadGoogleMaps(GOOGLE_MAPS_KEY).then(() => {
      if (cancelled || !mapRef.current || !window.google?.maps) return;
      const map = new window.google.maps.Map(mapRef.current, { center: start, zoom: 13 });
      const marker = new window.google.maps.Marker({
        position: start,
        map,
        draggable: true,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#c9a84c',
          fillOpacity: 1,
          strokeColor: '#0a0f1e',
          strokeWeight: 2,
        },
      });
      markerRef.current = marker;
      window.google.maps.event.addListener(map, 'click', (e) => {
        marker.setPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    });
    return () => { cancelled = true; };
  }, [mapOpen, value.latitude, value.longitude]);

  const confirmMapSelection = async () => {
    const position = markerRef.current?.getPosition();
    if (!position) return;
    const lat = position.lat();
    const lng = position.lng();
    const address = await reverseGeocode(lat, lng);
    onChange({ address, latitude: lat, longitude: lng });
    setMapOpen(false);
  };

  const useCurrentLocation = () => {
    setLocateError('');
    if (!navigator.geolocation) {
      setLocateError('Your browser does not support location access');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        onChange({ address, latitude, longitude });
        setLocating(false);
      },
      () => {
        setLocateError('Could not access your location. Check your browser/device permission settings.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value.address}
          onChange={e => onChange({ address: e.target.value, latitude: undefined, longitude: undefined })}
          placeholder={placeholder}
          className={`input-field flex-1 ${error ? 'border-red-400' : ''}`}
        />
        {GOOGLE_MAPS_KEY && (
          <button type="button" onClick={() => setMapOpen(true)} title="Select on map" className="px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
            <MapPin size={16} />
          </button>
        )}
        {allowCurrentLocation && (
          <button type="button" onClick={useCurrentLocation} disabled={locating} title="Use current location" className="px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
            <Crosshair size={16} className={locating ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
      {value.latitude !== undefined && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><MapPin size={11} /> Exact location set</p>
      )}
      {locateError && <p className="text-red-500 text-xs mt-1">{locateError}</p>}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {mapOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Pencil size={15} /> Drop a pin for {label.toLowerCase()}</h3>
              <button onClick={() => setMapOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Click or drag the marker to set the exact spot.</p>
            <div ref={mapRef} className="w-full h-80 rounded-xl bg-slate-100" />
            <div className="flex gap-3 mt-4">
              <button onClick={confirmMapSelection} className="flex-1 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: '#10b981' }}>Confirm Location</button>
              <button onClick={() => setMapOpen(false)} className="flex-1 py-3 rounded-xl font-semibold text-sm bg-slate-100 text-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
