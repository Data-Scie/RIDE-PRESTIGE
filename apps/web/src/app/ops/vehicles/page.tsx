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
  documents?: Array<{ id: string; label: string; status: string; expiryDate?: string; fileUrl?: string; rejectionReason?: string }>;
};

export default function OpsVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter, setFilter] = useState('pending');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => opsApi.get<{ data: Vehicle[] }>('/api/ops/vehicles').then(result => setVehicles(result.data));
  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  const update = async (id: string, action: 'approve' | 'reject', override = false) => {
    const reason = action === 'reject' ? window.prompt('Reason for rejection') || 'Vehicle compliance was not approved' : undefined;
    if (override && !window.confirm('Approve this vehicle without valid compliance dates/documents? Use this only when you have verified compliance another way.')) return;
    setUpdating(id);
    setError('');
    try {
      await opsApi.put(`/api/ops/vehicles/${id}/${action}${override ? '?override=true' : ''}`, { reason, override, approveAnyway: override });
      await load();
    } catch (e) {
      setError((e as Error).message || `Could not ${action} vehicle`);
    } finally {
      setUpdating(null);
    }
  };

  const saveCompliance = async (vehicle: Vehicle, dates: { motExpiry: string; insuranceExpiry: string; phvLicenceExpiry: string }) => {
    setUpdating(vehicle.id);
    setError('');
    try {
      await opsApi.put(`/api/ops/vehicles/${vehicle.id}`, dates);
      await load();
    } catch (e) {
      setError((e as Error).message || 'Could not update vehicle compliance');
    } finally {
      setUpdating(null);
    }
  };

  const updateDocument = async (vehicleId: string, documentId: string, action: 'approve' | 'reject', override = false) => {
    const reason = action === 'reject' ? window.prompt('Reason for rejection') || 'Vehicle document was not approved' : undefined;
    if (override && !window.confirm('Approve this document without a valid uploaded file? Use this only when you have verified compliance another way.')) return;
    setUpdating(`${vehicleId}:${documentId}`);
    setError('');
    try {
      await opsApi.put(`/api/ops/vehicles/${vehicleId}/documents/${documentId}/${action}${override ? '?override=true' : ''}`, { reason, override, approveAnyway: override });
      await load();
    } catch (e) {
      setError((e as Error).message || `Could not ${action} vehicle document`);
    } finally {
      setUpdating(null);
    }
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
          <VehicleCard key={vehicle.id} vehicle={vehicle} updating={updating === vehicle.id} onUpdate={update} onSaveCompliance={saveCompliance} onUpdateDocument={updateDocument} updatingKey={updating} />
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

function isExpired(value: string) {
  return !value || new Date(`${value}T23:59:59Z`).getTime() < Date.now();
}

function VehicleCard({
  vehicle,
  updating,
  updatingKey,
  onUpdate,
  onSaveCompliance,
  onUpdateDocument,
}: {
  vehicle: Vehicle;
  updating: boolean;
  updatingKey: string | null;
  onUpdate: (id: string, action: 'approve' | 'reject', override?: boolean) => void;
  onSaveCompliance: (vehicle: Vehicle, dates: { motExpiry: string; insuranceExpiry: string; phvLicenceExpiry: string }) => void;
  onUpdateDocument: (vehicleId: string, documentId: string, action: 'approve' | 'reject', override?: boolean) => void;
}) {
  const hasExpiredCompliance = [vehicle.motExpiry, vehicle.insuranceExpiry, vehicle.phvLicenceExpiry].some(isExpired);
  const documentsApproved = (vehicle.documents?.length ?? 0) >= 3 && (vehicle.documents ?? []).every(document => document.status === 'approved');
  const [editing, setEditing] = useState(false);
  const [motExpiry, setMotExpiry] = useState(vehicle.motExpiry || '');
  const [insuranceExpiry, setInsuranceExpiry] = useState(vehicle.insuranceExpiry || '');
  const [phvLicenceExpiry, setPhvLicenceExpiry] = useState(vehicle.phvLicenceExpiry || '');

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5">
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

            {hasExpiredCompliance && <p className="mt-3 text-xs text-red-600">Update expired compliance dates before approving this vehicle.</p>}
            {!documentsApproved && <p className="mt-3 text-xs text-amber-600">Approve or override MOT, insurance, and PHV documents before approving this vehicle.</p>}
            {vehicle.rejectionReason && <p className="mt-3 text-xs text-red-600">{vehicle.rejectionReason}</p>}

            {!!vehicle.documents?.length && (
              <div className="mt-4 grid gap-2">
                {vehicle.documents.map(document => {
                  const busy = updatingKey === `${vehicle.id}:${document.id}`;
                  const current = !!document.fileUrl && !!document.expiryDate && !isExpired(document.expiryDate);
                  return (
                    <div key={document.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{document.label}</p>
                          <p className={`mt-1 text-[11px] font-semibold capitalize ${current ? 'text-slate-500' : 'text-red-600'}`}>{document.status} · {document.expiryDate || 'missing expiry'}</p>
                          {document.rejectionReason && <p className="mt-1 text-[11px] text-red-600">{document.rejectionReason}</p>}
                          {document.fileUrl && <a href={document.fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-blue-600">Open document</a>}
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          <button onClick={() => onUpdateDocument(vehicle.id, document.id, 'approve')} disabled={busy || !current || document.status === 'approved'} className="rounded-lg bg-green-600 px-2 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50">Approve</button>
                          {document.status !== 'approved' && (
                            <button onClick={() => onUpdateDocument(vehicle.id, document.id, 'approve', true)} disabled={busy} className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-[11px] font-semibold text-amber-700 disabled:opacity-50">Approve anyway</button>
                          )}
                          <button onClick={() => onUpdateDocument(vehicle.id, document.id, 'reject')} disabled={busy} className="rounded-lg bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-600 disabled:opacity-50">Reject</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {editing && (
              <div className="grid sm:grid-cols-3 gap-2 mt-4">
                <label className="text-xs font-semibold text-slate-500">MOT<input type="date" value={motExpiry} onChange={e => setMotExpiry(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 font-normal text-slate-700" /></label>
                <label className="text-xs font-semibold text-slate-500">Insurance<input type="date" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 font-normal text-slate-700" /></label>
                <label className="text-xs font-semibold text-slate-500">PHV licence<input type="date" value={phvLicenceExpiry} onChange={e => setPhvLicenceExpiry(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 font-normal text-slate-700" /></label>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditing(value => !value)} disabled={updating} className="px-3 py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold disabled:opacity-50">
                {editing ? 'Close dates' : 'Edit compliance'}
              </button>
              {editing && (
                <button onClick={() => onSaveCompliance(vehicle, { motExpiry, insuranceExpiry, phvLicenceExpiry })} disabled={updating} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-50">
                  {updating ? 'Saving...' : 'Save dates'}
                </button>
              )}
              {vehicle.approvalStatus !== 'approved' && (
                <button onClick={() => onUpdate(vehicle.id, 'approve')} disabled={updating || hasExpiredCompliance || !documentsApproved} className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50">
                  <CheckCircle size={14} /> {updating ? 'Approving...' : 'Approve'}
                </button>
              )}
              {vehicle.approvalStatus !== 'approved' && (hasExpiredCompliance || !documentsApproved) && (
                <button onClick={() => onUpdate(vehicle.id, 'approve', true)} disabled={updating} className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold flex items-center gap-1 disabled:opacity-50">
                  <CheckCircle size={14} /> Approve anyway
                </button>
              )}
              {vehicle.approvalStatus !== 'rejected' && (
                <button onClick={() => onUpdate(vehicle.id, 'reject')} disabled={updating} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1 disabled:opacity-50">
                  <XCircle size={14} /> {updating ? 'Rejecting...' : 'Reject'}
                </button>
              )}
            </div>
          </div>
  );
}

function Expiry({ label, value }: { label: string; value: string }) {
  const expired = isExpired(value);
  return (
    <div className={`p-2 rounded-lg ${expired ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
      <p className="font-semibold">{label}</p>
      <p>{value || 'Missing'}</p>
    </div>
  );
}
