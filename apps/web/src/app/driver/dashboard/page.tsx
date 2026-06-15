'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck, Building2, Car, CheckCircle, FileCheck2, Mail, MapPin,
  Navigation, Phone, Star, TrendingUp, UserRound,
} from 'lucide-react';
import { driverApi } from '@/lib/api-client';
import { getDriverSocket } from '@/lib/realtime';

interface DriverProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  postcode: string;
  status: 'available' | 'busy' | 'offline';
  driverType: 'affiliateDriver' | 'independentDriver';
  rating: number;
  totalJobs: number;
  totalEarnings: number;
  documentsStatus: string;
  applicationStatus: string;
  privateHireBadgeNumber: string;
  drivingLicenceNumber: string;
  affiliate?: { companyName: string; tradingName?: string } | null;
  assignedVehicle?: { make: string; model: string; registration: string; colour: string } | null;
}

interface DashboardData {
  todayJobs: number;
  completedJobs: number;
  todayEarnings: number;
  pendingPayout: number;
  currentJob?: RideRequest | null;
}

interface RideRequest {
  id: string;
  jobId?: string;
  bookingRef: string;
  status: string;
  yourEarnings?: number | null;
  distance?: string;
  passengerCount: number;
  pickupAddress: string;
  dropoffAddress: string;
  expiresAt?: string;
}

export default function DriverDashboard() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [online, setOnline] = useState(false);
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    const [profileResult, dashboardResult] = await Promise.all([
      driverApi.get<{ success: boolean; data: DriverProfile }>('/api/driver/profile'),
      driverApi.get<{ success: boolean; data: DashboardData }>('/api/driver/dashboard'),
    ]);
    setProfile(profileResult.data);
    setStats(dashboardResult.data);
    setOnline(profileResult.data.status !== 'offline');
  };

  useEffect(() => {
    load().catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const pollForRide = useCallback(() => {
    if (!online || !profile) return;
    const path = profile.driverType === 'independentDriver' ? '/api/driver/jobs/available' : '/api/driver/jobs/my';
    driverApi.get<{ success: boolean; data: RideRequest[] }>(path)
      .then(result => {
        const request = result.data.find(job => profile.driverType === 'independentDriver'
          ? job.status === 'awaiting_affiliate'
          : ['driver_assigned', 'vehicle_assigned'].includes(job.status));
        setRideRequest(request ?? null);
      })
      .catch(() => {});
  }, [online, profile]);

  useEffect(() => {
    pollForRide();
    const interval = setInterval(pollForRide, 15000);
    const socket = getDriverSocket();
    const refresh = () => {
      pollForRide();
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('New Ride Prestige offer', { body: 'Open the driver portal to review it.' });
      }
    };
    socket?.on('ride:offer', refresh);
    socket?.on('notification:new', pollForRide);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    return () => {
      clearInterval(interval);
      socket?.off('ride:offer', refresh);
      socket?.off('notification:new', pollForRide);
    };
  }, [pollForRide]);

  const toggleOnline = async () => {
    const next = !online;
    await driverApi.put('/api/driver/status', { status: next ? 'available' : 'offline' });
    setOnline(next);
    setProfile(current => current ? { ...current, status: next ? 'available' : 'offline' } : current);
    if (!next) setRideRequest(null);
  };

  const acceptRide = async () => {
    if (!rideRequest || !profile) return;
    const action = profile.driverType === 'independentDriver' ? 'claim' : 'accept';
    await driverApi.post(`/api/driver/jobs/${rideRequest.id}/${action}`, {});
    setRideRequest(null);
    await load();
  };

  const declineRide = async () => {
    if (!rideRequest) return;
    await driverApi.post(`/api/driver/jobs/${rideRequest.id}/decline`, {});
    setRideRequest(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading dashboard...</div>;
  if (!profile) return <div className="p-6 text-red-500">{error || 'Driver profile could not be loaded.'}</div>;

  const fleetName = profile.driverType === 'affiliateDriver'
    ? profile.affiliate?.tradingName || profile.affiliate?.companyName || 'Affiliate company'
    : 'Direct Ride Prestige driver';

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-blue-600 font-semibold">Welcome back</p>
          <h1 className="text-2xl font-bold text-slate-800">{profile.fullName}</h1>
          <p className="text-sm text-slate-500">{fleetName} · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
          <div><p className="text-xs font-semibold text-slate-700">{online ? 'Available for rides' : 'Currently offline'}</p><p className="text-[11px] text-slate-400">Control your dispatch availability</p></div>
          <button onClick={toggleOnline} className={`relative w-12 h-7 rounded-full transition-colors ${online ? 'bg-green-500' : 'bg-slate-300'}`}><span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${online ? 'left-6' : 'left-1'}`} /></button>
        </div>
      </div>

      {rideRequest && (
        <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center"><Navigation size={21} /></div>
            <div className="flex-1 min-w-60"><p className="font-bold">New ride assignment · {rideRequest.bookingRef}</p><p className="text-sm text-blue-100">{rideRequest.pickupAddress} → {rideRequest.dropoffAddress}</p><p className="text-xs text-blue-200 mt-1">{rideRequest.distance || 'Distance pending'} · {rideRequest.passengerCount} passengers</p></div>
            {profile.driverType === 'independentDriver' && (
              <div className="text-right"><p className="font-bold text-xl">£{rideRequest.yourEarnings ?? 0}</p><p className="text-xs text-blue-200">Your payout</p></div>
            )}
            {rideRequest.expiresAt && <p className="text-xs text-blue-100">Expires {new Date(rideRequest.expiresAt).toLocaleTimeString('en-GB')}</p>}
            <button onClick={declineRide} className="px-4 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm">Decline</button>
            <button onClick={acceptRide} className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-sm">Accept Ride</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ...(profile.driverType === 'independentDriver'
            ? [{ label: "Today's Earnings", value: `£${stats?.todayEarnings ?? 0}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' }]
            : []),
          { label: "Today's Jobs", value: stats?.todayJobs ?? 0, icon: Navigation, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed Rides', value: stats?.completedJobs ?? profile.totalJobs, icon: CheckCircle, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Driver Rating', value: profile.rating ? profile.rating.toFixed(1) : 'New', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg} ${color}`}><Icon size={18} /></div>
            <p className="text-2xl font-bold text-slate-800">{value}</p><p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold">{profile.fullName.split(' ').map(part => part[0]).join('').slice(0, 2)}</div>
              <div><h2 className="text-xl font-bold text-slate-800">{profile.fullName}</h2><p className="text-sm text-slate-500 capitalize">{profile.driverType === 'affiliateDriver' ? 'Affiliate Driver' : 'Independent Driver'}</p></div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold capitalize"><BadgeCheck size={14} /> {profile.applicationStatus}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            <Info icon={Mail} label="Email Address" value={profile.email} />
            <Info icon={Phone} label="Phone Number" value={profile.phone} />
            <Info icon={MapPin} label="Location" value={`${profile.city}, ${profile.postcode}`} />
            <Info icon={Building2} label={profile.driverType === 'affiliateDriver' ? 'Affiliate Company' : 'Network'} value={fleetName} />
            <Info icon={FileCheck2} label="Private Hire Badge" value={profile.privateHireBadgeNumber} />
            <Info icon={UserRound} label="Driving Licence" value={profile.drivingLicenceNumber} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Compliance</h2>
            <StatusRow label="Account approval" value={profile.applicationStatus} good={profile.applicationStatus === 'approved'} />
            <StatusRow label="Documents" value={profile.documentsStatus} good={profile.documentsStatus === 'approved'} />
            <StatusRow label="Availability" value={online ? 'available' : 'offline'} good={online} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3"><Car size={17} className="text-blue-600" /><h2 className="font-semibold text-slate-800">Assigned Vehicle</h2></div>
            {profile.assignedVehicle ? <><p className="font-bold text-slate-800">{profile.assignedVehicle.make} {profile.assignedVehicle.model}</p><p className="text-sm text-slate-500">{profile.assignedVehicle.registration} · {profile.assignedVehicle.colour}</p></> : <p className="text-sm text-slate-400">No permanent vehicle assigned. Your affiliate can allocate a vehicle with each ride.</p>}
          </div>
          <Link href="/driver/ride" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm"><Navigation size={16} /> Open Active Ride</Link>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return <div className="flex items-start gap-3"><div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500"><Icon size={15} /></div><div><p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</p><p className="text-sm text-slate-700 font-medium break-all">{value || 'Not provided'}</p></div></div>;
}

function StatusRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"><span className="text-sm text-slate-500">{label}</span><span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${good ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{value}</span></div>;
}
