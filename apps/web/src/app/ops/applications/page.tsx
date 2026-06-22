'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Car, Search, Users } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

interface Affiliate { id: string; companyName: string; contactPerson: string; email: string; phone: string; isApproved: boolean; createdAt: string; }
interface Driver { id: string; fullName: string; email: string; phone: string; driverType: 'affiliateDriver' | 'independentDriver'; applicationStatus: 'pending' | 'approved' | 'rejected' | 'suspended'; affiliate?: { id: string; companyName: string } | null; }
interface Vehicle { id: string; make: string; model: string; registration: string; approvalStatus: string; ownerDriverId?: string; }

type Tab = 'affiliate' | 'driverVehicle';
type SubFilter = 'received' | 'approved' | 'rejected';

const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: 'affiliate', label: 'Affiliate Applications', icon: Building2 },
  { key: 'driverVehicle', label: 'Driver + Vehicle Applications', icon: Car },
];

export default function OpsApplicationsPage() {
  const [tab, setTab] = useState<Tab>('affiliate');
  const [sub, setSub] = useState<SubFilter>('received');
  const [search, setSearch] = useState('');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setError('');
    const [a, d, v] = await Promise.allSettled([
      opsApi.get<{ success: boolean; data: Affiliate[] }>('/api/ops/affiliates'),
      opsApi.get<{ success: boolean; data: Driver[] }>('/api/ops/drivers'),
      opsApi.get<{ success: boolean; data: Vehicle[] }>('/api/ops/vehicles'),
    ]);

    const failures: string[] = [];
    if (a.status === 'fulfilled') setAffiliates(a.value.data);
    else failures.push(`affiliate companies: ${(a.reason as Error).message}`);

    if (d.status === 'fulfilled') setDrivers(d.value.data);
    else failures.push(`drivers: ${(d.reason as Error).message}`);

    if (v.status === 'fulfilled') setVehicles(v.value.data);
    else failures.push(`vehicles: ${(v.reason as Error).message}`);

    if (failures.length) setError(`Could not load ${failures.join('; ')}`);
  };

  useEffect(() => {
    load().catch(e => setError(e.message)).finally(() => setLoading(false));
    setSub('received');
  }, [tab]);

  const act = async (path: string, action: string, refresh = true, body: Record<string, unknown> = {}) => {
    setUpdating(path);
    setError('');
    try {
      const query = body.override || body.approveAnyway ? '?override=true' : '';
      await opsApi.put(`${path}/${action}${query}`, { ...body, approveAnyway: Boolean(body.override || body.approveAnyway) });
      if (refresh) await load();
    } catch (e) {
      setError((e as Error).message || 'Action failed');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading applications...</div>;

  const independentDrivers = drivers.filter(d => d.driverType === 'independentDriver');
  const vehicleOwnerIds = new Set(vehicles.filter(v => v.ownerDriverId).map(v => v.ownerDriverId));
  const driverVehicleDrivers = independentDrivers.filter(d => vehicleOwnerIds.has(d.id));

  const term = search.toLowerCase();

  const visibleAffiliates = affiliates.filter(a => {
    const matchesSub = sub === 'received' ? !a.isApproved : sub === 'approved' ? a.isApproved : false;
    const matchesSearch = !term || [a.companyName, a.contactPerson, a.email].some(v => v.toLowerCase().includes(term));
    return matchesSub && matchesSearch;
  });

  const visibleDriverVehicle = driverVehicleDrivers.filter(d => {
    const matchesSub = sub === 'received' ? d.applicationStatus === 'pending' : sub === 'approved' ? d.applicationStatus === 'approved' : ['rejected', 'suspended'].includes(d.applicationStatus);
    const matchesSearch = !term || [d.fullName, d.email].some(v => v.toLowerCase().includes(term));
    return matchesSub && matchesSearch;
  });

  const subFilters: { key: SubFilter; label: string }[] = [
    { key: 'received', label: 'Received' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Applications</h1>
        <p className="text-slate-500 text-sm">Review affiliate company onboarding and driver+vehicle pairing applications. For driver-only applications, see Drivers.</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: tab === key ? '#0a0f1e' : '#fff', color: tab === key ? '#fff' : '#64748b', border: '1px solid', borderColor: tab === key ? '#0a0f1e' : '#e2e8f0' }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none" />
        </div>
        {subFilters.map(({ key, label }) => (
          tab === 'affiliate' && key === 'rejected' ? null : (
            <button key={key} onClick={() => setSub(key)} className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: sub === key ? '#3b82f6' : '#f8fafc', color: sub === key ? 'white' : '#64748b' }}>{label}</button>
          )
        ))}
      </div>

      {tab === 'affiliate' && (
        <div className="grid gap-3">
          {visibleAffiliates.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Building2 size={18} className="text-blue-600" /></div>
                <div>
                  <p className="font-semibold text-slate-800">{a.companyName}</p>
                  <p className="text-xs text-slate-400">{a.contactPerson} · {a.email} · {a.phone}</p>
                </div>
              </div>
              {!a.isApproved && (
                <div className="flex gap-2">
                  <Link href={`/ops/affiliates/${a.id}`} className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50">Review documents</Link>
                  <button disabled={updating === `/api/ops/affiliates/${a.id}`} onClick={() => act(`/api/ops/affiliates/${a.id}`, 'approve')} className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-green-600 disabled:opacity-50">Approve</button>
                  <button disabled={updating === `/api/ops/affiliates/${a.id}`} onClick={() => act(`/api/ops/affiliates/${a.id}`, 'suspend')} className="px-3 py-2 rounded-lg text-xs font-semibold text-red-600 bg-red-50 disabled:opacity-50">Reject</button>
                </div>
              )}
            </div>
          ))}
          {!visibleAffiliates.length && <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-400 text-sm">No affiliate applications in this state.</div>}
        </div>
      )}

      {tab === 'driverVehicle' && (
        <div className="grid gap-3">
          {visibleDriverVehicle.map(d => {
            const vehicle = vehicles.find(v => v.ownerDriverId === d.id);
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><Users size={18} className="text-purple-600" /></div>
                  <div>
                    <p className="font-semibold text-slate-800">{d.fullName}</p>
                    <p className="text-xs text-slate-400">{d.email} · {d.phone}</p>
                    {vehicle && <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Car size={11} /> {vehicle.make} {vehicle.model} ({vehicle.registration}) · <span className="capitalize">{vehicle.approvalStatus}</span></p>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/ops/drivers/${d.id}`} className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50">Review documents</Link>
                  {d.applicationStatus === 'pending' && (
                    <>
                      <button disabled={updating === `/api/ops/drivers/${d.id}`} onClick={() => act(`/api/ops/drivers/${d.id}`, 'approve')} className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-green-600 disabled:opacity-50">Approve driver</button>
                      <button
                        disabled={updating === `/api/ops/drivers/${d.id}`}
                        onClick={() => window.confirm('Approve this driver even if documents are missing? Use this only after manual verification.') && act(`/api/ops/drivers/${d.id}`, 'approve', true, { override: true })}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 disabled:opacity-50"
                      >
                        Approve driver anyway
                      </button>
                      <button disabled={updating === `/api/ops/drivers/${d.id}`} onClick={() => act(`/api/ops/drivers/${d.id}`, 'reject')} className="px-3 py-2 rounded-lg text-xs font-semibold text-red-600 bg-red-50 disabled:opacity-50">Reject driver</button>
                    </>
                  )}
                  {vehicle && vehicle.approvalStatus === 'pending' && (
                    <>
                      <Link href="/ops/vehicles" className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50">Review vehicle docs</Link>
                      <button disabled={updating === `/api/ops/vehicles/${vehicle.id}`} onClick={() => act(`/api/ops/vehicles/${vehicle.id}`, 'approve')} className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 disabled:opacity-50">Approve vehicle</button>
                      <button
                        disabled={updating === `/api/ops/vehicles/${vehicle.id}`}
                        onClick={() => window.confirm('Approve this vehicle even if compliance documents are missing? Use this only after manual verification.') && act(`/api/ops/vehicles/${vehicle.id}`, 'approve', true, { override: true })}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 disabled:opacity-50"
                      >
                        Approve vehicle anyway
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {!visibleDriverVehicle.length && <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-400 text-sm">No driver+vehicle applications in this state.</div>}
        </div>
      )}
    </div>
  );
}
