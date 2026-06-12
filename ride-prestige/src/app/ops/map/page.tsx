'use client';
import { useState, useEffect, useRef } from 'react';
import { Car, Navigation, Users, MapPin, X, Phone, Route, Clock } from 'lucide-react';
import { mockRides, mockDrivers, mockAffiliates } from '@/lib/mock-ops';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { google: any; initOpsMap: () => void; } }

const STATUS_COLOR: Record<string, string> = {
  in_progress: '#10b981', en_route: '#8b5cf6', dispatched: '#3b82f6',
  pending: '#f59e0b', completed: '#6b7280',
};

export default function OpsMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selected, setSelected] = useState<{ type: 'driver' | 'ride' | 'affiliate_driver'; id: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'independent' | 'affiliate'>('all');

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps) { initMap(); return; }
    window.initOpsMap = initMap;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initOpsMap`;
    script.async = true;
    document.head.appendChild(script);
  }, [apiKey]);

  function initMap() {
    if (!mapRef.current || !window.google) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 53.3811, lng: -1.4701 },
      zoom: 12,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
      ],
    });

    mockDrivers.filter(d => d.status !== 'offline').forEach(driver => {
      const marker = new window.google.maps.Marker({
        position: driver.location,
        map,
        title: driver.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: driver.status === 'on_ride' ? '#10b981' : '#3b82f6',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      });
      marker.addListener('click', () => setSelected({ type: 'driver', id: driver.id }));
    });

    mockRides.filter(r => r.driverLocation && ['in_progress', 'en_route', 'dispatched'].includes(r.status)).forEach(ride => {
      new window.google.maps.Marker({
        position: ride.pickup.location,
        map,
        title: `Pickup: ${ride.customer.name}`,
        icon: { path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6, fillColor: '#f59e0b', fillOpacity: 1, strokeColor: 'white', strokeWeight: 1.5 },
      });
    });

    setMapLoaded(true);
  }

  const selectedDriver = selected?.type === 'driver' ? mockDrivers.find(d => d.id === selected.id) : null;
  const selectedRide = selected?.type === 'ride' ? mockRides.find(r => r.id === selected.id) : null;

  const activeRides = mockRides.filter(r => ['in_progress', 'en_route', 'dispatched', 'pending'].includes(r.status));

  return (
    <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-48px)] flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Live Operations Map</h1>
          <p className="text-slate-500 text-xs">Real-time driver & customer tracking · Sheffield & South Yorkshire</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { v: 'all', label: 'All' }, { v: 'active', label: 'Active Rides' },
            { v: 'independent', label: 'Independent' }, { v: 'affiliate', label: 'Affiliates' },
          ].map(({ v, label }) => (
            <button key={v} onClick={() => setFilter(v as typeof filter)} className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all" style={{ background: filter === v ? '#3b82f6' : 'white', color: filter === v ? 'white' : '#64748b', border: '1px solid', borderColor: filter === v ? '#3b82f6' : '#e2e8f0' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Map */}
        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg" style={{ minHeight: '400px' }}>
          {!apiKey ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: '#1e293b' }}>
              <MapPin size={40} className="text-blue-400 mb-4" />
              <p className="text-white font-semibold mb-2">Google Maps — API Key Required</p>
              <p className="text-slate-400 text-sm text-center max-w-xs px-4">Add <code className="bg-slate-700 px-1.5 py-0.5 rounded text-blue-300 text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in Vercel environment variables to enable live tracking</p>
              <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-sm px-4">
                {mockDrivers.filter(d => d.status !== 'offline').map(d => (
                  <button key={d.id} onClick={() => setSelected({ type: 'driver', id: d.id })} className="p-3 rounded-xl text-left transition-all hover:opacity-80" style={{ background: '#334155', border: selected?.id === d.id ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: d.status === 'on_ride' ? '#10b981' : '#3b82f6' }}>{d.avatar}</div>
                      <span className="text-white text-xs font-medium truncate">{d.name}</span>
                    </div>
                    <span className="text-xs capitalize" style={{ color: d.status === 'on_ride' ? '#10b981' : '#60a5fa' }}>{d.status.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="absolute inset-0" />
          )}

          {/* Map legend */}
          <div className="absolute bottom-4 left-4 flex gap-3 flex-wrap">
            {[
              { color: '#10b981', label: 'On ride' }, { color: '#3b82f6', label: 'Available' },
              { color: '#f59e0b', label: 'Pickup point' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(0,0,0,0.7)', color: 'white', backdropFilter: 'blur(4px)' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />{label}
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto">
          {/* Selected detail */}
          {selectedDriver && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Driver Detail</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white" style={{ background: selectedDriver.status === 'on_ride' ? '#10b981' : '#3b82f6', fontSize: '16px' }}>{selectedDriver.avatar}</div>
                <div>
                  <p className="font-semibold text-slate-800">{selectedDriver.name}</p>
                  <p className="text-xs text-slate-500">{selectedDriver.vehicleModel} · {selectedDriver.vehicleReg}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: selectedDriver.status === 'on_ride' ? '#10b981' : selectedDriver.status === 'online' ? '#3b82f6' : '#94a3b8' }} />
                    <span className="text-xs capitalize font-medium" style={{ color: selectedDriver.status === 'on_ride' ? '#10b981' : '#3b82f6' }}>{selectedDriver.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[{ label: 'Total Rides', value: selectedDriver.totalRides }, { label: 'Rating', value: selectedDriver.rating || '—' }, { label: 'Today (£)', value: selectedDriver.earningsToday }].map(({ label, value }) => (
                  <div key={label} className="text-center p-2 rounded-xl" style={{ background: '#f8fafc' }}>
                    <p className="font-bold text-slate-800 text-sm">{value}</p>
                    <p className="text-xs text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
              <a href={`tel:${selectedDriver.phone}`} className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#3b82f6' }}>
                <Phone size={14} /> Call Driver
              </a>
            </div>
          )}

          {/* Active rides list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Active Rides ({activeRides.length})</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {activeRides.map(ride => (
                <button key={ride.id} onClick={() => setSelected({ type: 'ride', id: ride.id })} className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-semibold text-slate-700">{ride.ref}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: STATUS_COLOR[ride.status] + '20', color: STATUS_COLOR[ride.status] }}>{ride.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{ride.customer.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Route size={10} className="text-slate-400" />
                    <span className="text-xs text-slate-400">{ride.pickup.postcode} → {ride.dropoff.postcode}</span>
                  </div>
                  {ride.assignedTo && <p className="text-xs text-blue-500 mt-0.5">{ride.assignedTo.driverName || ride.assignedTo.name}</p>}
                </button>
              ))}
              {activeRides.length === 0 && <p className="px-4 py-8 text-center text-slate-400 text-sm">No active rides</p>}
            </div>
          </div>

          {/* Online drivers summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Online Network</h3>
            <div className="space-y-2">
              {[
                { label: 'Independent (online)', value: mockDrivers.filter(d => d.status === 'online' && d.approvalStatus === 'approved').length, color: '#3b82f6' },
                { label: 'On ride (independent)', value: mockDrivers.filter(d => d.status === 'on_ride').length, color: '#10b981' },
                { label: 'Affiliate drivers', value: mockAffiliates.filter(a => a.approvalStatus === 'approved').reduce((s, a) => s + a.drivers.filter(d => d.status !== 'offline').length, 0), color: '#8b5cf6' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} /><span className="text-xs text-slate-600">{label}</span></div>
                  <span className="font-bold text-slate-800 text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
