'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Search, XCircle } from 'lucide-react';
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
};

export default function OpsVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter, setFilter] = useState('pending');
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
    const term = search.toLowerCase();
    return matchesStatus && (!term || `${vehicle.make} ${vehicle.model} ${vehicle.registration}`.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-800">Vehicle Approvals</h1><p className="text-sm text-slate-500">Review independent-driver vehicles and compliance expiry dates.</p></div>
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56"><Search size={15} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search registration or model" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
        {['pending','approved','rejected','all'].map(value => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize ${filter === value ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{value}</button>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {visible.map(vehicle => (
          <div key={vehicle.id} className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex justify-between gap-3"><div><h2 className="font-bold text-slate-800">{vehicle.make} {vehicle.model}</h2><p className="text-sm text-slate-500">{vehicle.registration} · {vehicle.vehicleCategory} · {vehicle.passengerCapacity} passengers</p></div><span className="text-xs font-semibold capitalize">{vehicle.approvalStatus}</span></div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <Expiry label="MOT" value={vehicle.motExpiry} /><Expiry label="Insurance" value={vehicle.insuranceExpiry} /><Expiry label="PHV licence" value={vehicle.phvLicenceExpiry} />
            </div>
            {vehicle.rejectionReason && <p className="mt-3 text-xs text-red-600">{vehicle.rejectionReason}</p>}
            <div className="flex gap-2 mt-4">
              {vehicle.approvalStatus !== 'approved' && <button onClick={() => update(vehicle.id, 'approve')} className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold flex items-center gap-1"><CheckCircle size={14} /> Approve</button>}
              {vehicle.approvalStatus !== 'rejected' && <button onClick={() => update(vehicle.id, 'reject')} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1"><XCircle size={14} /> Reject</button>}
            </div>
          </div>
        ))}
      </div>
      {!visible.length && <div className="py-16 text-center text-slate-400">No vehicles match this filter.</div>}
    </div>
  );
}

function Expiry({ label, value }: { label: string; value: string }) {
  const expired = !value || new Date(`${value}T23:59:59Z`).getTime() < Date.now();
  return <div className={`p-2 rounded-lg ${expired ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}><p className="font-semibold">{label}</p><p>{value || 'Missing'}</p></div>;
}
