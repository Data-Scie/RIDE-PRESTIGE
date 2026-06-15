'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Search, XCircle, Car, Building2, User } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

type Vehicle = {
  id: string;
  make: string;
  model: string;
  registration: string;
  vehicleCategory: string;
  passengerCapacity: number;
  motExpiry: string;
  insuranceExpiry: string;
  phvLicenceExpiry: string;
  approvalStatus: string;
  ownerDriverId?: string;
  affiliateId?: string;
  rejectionReason?: string;
  ownerDriver?: { id: string; fullName: string; email: string; phone: string } | null;
  ownerAffiliate?: { id: string; tradingName: string; companyName: string } | null;
};

export default function OpsVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter, setFilter] = useState('pending');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = () => opsApi.get<{ data: Vehicle[] }>('/api/ops/vehicles').then(result => setVehicles(result.data));
  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  const update = async (id: string, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? window.prompt('Reason for rejection') || 'Vehicle compliance was not approved' : undefined;
    await opsApi.put(`/api/ops/vehicles/${id}/${action}`, { reason });
    await load();
  };

  const visible = vehicles.filter(vehicle => {
    const matchesStatus = filter === 'all' || vehicle.approvalStatus === filter;
    const matchesOwner = ownerFilter === 'all'
      || (ownerFilter === 'independent' && !!vehicle.ownerDriverId)
      || (ownerFilter === 'affiliate' && !!vehicle.affiliateId);
    const term = search.toLowerCase();
    return matchesStatus && matchesOwner && (!term || `${vehicle.make} ${vehicle.model} ${vehicle.registration}`.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Vehicle Approvals</h1>
        <p className="text-sm text-slate-500">Review independent-driver and affiliate vehicles. Check compliance expiry dates before approving.</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search registration or model" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['pending','approved','rejected','all'].map(value => (
            <button key={value} onClick={() => setFilter(value)} className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize ${filter === value ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{value}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All Owners' },
            { value: 'independent', label: 'Independent' },
            { value: 'affiliate', label: 'Affiliate' },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => setOwnerFilter(value)} className={`px-3 py-2 rounded-xl text-xs font-semibold ${ownerFilter === value ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500'}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {visible.map(vehicle => (
          <div key={vehicle.id} className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-slate-800">{vehicle.make} {vehicle.model}</h2>
                  {vehicle.ownerDriverId
                    ? <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><User size={10} /> Independent</span>
                    : <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Building2 size={10} /> Affiliate</span>
                  }
                </div>
                <p className="text-sm text-slate-500">{vehicle.registration} · {vehicle.vehicleCategory} · {vehicle.passengerCapacity} passengers</p>
                {vehicle.ownerDriver && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><User size={11} /> {vehicle.ownerDriver.fullName} · {vehicle.ownerDriver.phone}</p>
                )}
                {vehicle.ownerAffiliate && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Building2 size={11} /> {vehicle.ownerAffiliate.tradingName || vehicle.ownerAffiliate.companyName}</p>
                )}
              </div>
              <span className={`text-xs font-semibold capitalize px-2 py-1 rounded-lg h-fit ${
                vehicle.approvalStatus === 'approved' ? 'bg-green-50 text-green-700' :
                vehicle.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700' :
                'bg-amber-50 text-amber-700'
              }`}>{vehicle.approvalStatus}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <Expiry label="MOT" value={vehicle.motExpiry} />
              <Expiry label="Insurance" value={vehicle.insuranceExpiry} />
              <Expiry label="PHV licence" value={vehicle.phvLicenceExpiry} />
            </div>

            {vehicle.rejectionReason && <p className="mt-3 text-xs text-red-600">{vehicle.rejectionReason}</p>}

            <div className="flex gap-2 mt-4">
              {vehicle.approvalStatus !== 'approved' && (
                <button onClick={() => update(vehicle.id, 'approve')} className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold flex items-center gap-1">
                  <CheckCircle size={14} /> Approve
                </button>
              )}
              {vehicle.approvalStatus !== 'rejected' && (
                <button onClick={() => update(vehicle.id, 'reject')} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1">
                  <XCircle size={14} /> Reject
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!visible.length && (
        <div className="py-16 text-center">
          <Car size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">No vehicles match this filter.</p>
        </div>
      )}
    </div>
  );
}

function Expiry({ label, value }: { label: string; value: string }) {
  const expired = !value || new Date(`${value}T23:59:59Z`).getTime() < Date.now();
  return (
    <div className={`p-2 rounded-lg ${expired ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
      <p className="font-semibold">{label}</p>
      <p>{value || 'Missing'}</p>
    </div>
  );
}
