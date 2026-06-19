'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Mail, Phone, Star, XCircle } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

function RejectDocModal({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="font-bold text-slate-800 mb-1">Reject Document</h3>
        <p className="text-sm text-slate-500 mb-4">Provide a reason so the driver knows what to resubmit.</p>
        <textarea
          autoFocus value={reason} onChange={e => setReason(e.target.value)}
          placeholder="e.g. Document is blurry, please resubmit a clear scan."
          rows={3} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-red-400 resize-none"
        />
        <div className="flex gap-2 mt-4">
          <button onClick={() => onConfirm(reason || 'Document was not approved')} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500">Reject Document</button>
          <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100">Cancel</button>
        </div>
      </div>
    </div>
  );
}

interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  applicationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  driverType: 'affiliateDriver' | 'independentDriver';
  affiliate?: { id: string; companyName: string } | null;
  rating: number;
  totalJobs: number;
  joinedDate: string;
  documents?: Array<{ id: string; label: string; status: string; expiryDate?: string; fileUrl?: string; rejectionReason?: string }>;
}

interface Vehicle {
  id: string; make: string; model: string; registration: string; approvalStatus: string;
}

interface RecentJob {
  id: string;
  bookingRef: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  fareAmount: number;
}

export default function DriverDetailPage() {
  const { id } = useParams() as { id: string };
  const [driver, setDriver] = useState<Driver | null>(null);
  const [rides, setRides] = useState<RecentJob[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);

  const load = async () => {
    const result = await opsApi.get<{ success: boolean; data: Driver; jobs: RecentJob[]; vehicles: Vehicle[] }>(`/api/ops/drivers/${id}`);
    setDriver(result.data);
    setRides(result.jobs ?? []);
    setVehicles(result.vehicles ?? []);
  };

  const updateDocument = async (documentId: string, action: 'approve' | 'reject', reason?: string, override = false) => {
    if (override && !window.confirm('Approve this document without a valid uploaded file? Use this only when you have verified compliance another way.')) return;
    await opsApi.put(`/api/ops/drivers/${id}/documents/${documentId}/${action}`, { reason, override });
    await load();
  };

  useEffect(() => {
    load().catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const updateApplication = async (action: 'approve' | 'reject' | 'suspend') => {
    setUpdating(true);
    setError('');
    try {
      const result = await opsApi.put<{ success: boolean; data: Driver }>(`/api/ops/drivers/${id}/${action}`, {});
      setDriver(result.data);
    } catch (e) {
      setError((e as Error).message || `Could not ${action} driver`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading driver...</div>;
  if (!driver) return <div className="p-8 text-red-500">{error || 'Driver not found'}. <Link href="/ops/drivers" className="text-blue-500">Back</Link></div>;

  const statusColor = driver.status === 'available' ? '#10b981' : driver.status === 'busy' ? '#3b82f6' : '#94a3b8';

  return (
    <div className="max-w-4xl space-y-5">
      {rejectDocId && (
        <RejectDocModal
          onConfirm={async (reason) => {
            setRejectDocId(null);
            await updateDocument(rejectDocId, 'reject', reason);
          }}
          onCancel={() => setRejectDocId(null)}
        />
      )}
      <Link href="/ops/drivers" className="flex items-center gap-1.5 text-slate-500 text-sm"><ArrowLeft size={15} /> Back to Driver Applications</Link>
      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: statusColor }}>{driver.fullName.charAt(0)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-slate-800">{driver.fullName}</h1>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize bg-slate-100 text-slate-700">{driver.applicationStatus}</span>
              <span className="text-xs capitalize font-medium" style={{ color: statusColor }}>{driver.status}</span>
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {driver.driverType === 'affiliateDriver' ? `Affiliate Driver - ${driver.affiliate?.companyName ?? 'Unknown affiliate'}` : 'Independent Driver - Direct Ride Prestige network'}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
              <a href={`tel:${driver.phone}`} className="flex items-center gap-1.5"><Phone size={13} /> {driver.phone}</a>
              <a href={`mailto:${driver.email}`} className="flex items-center gap-1.5"><Mail size={13} /> {driver.email}</a>
            </div>
          </div>
          <div className="flex gap-2">
            {driver.applicationStatus !== 'approved' && <button onClick={() => updateApplication('approve')} disabled={updating} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-green-600 disabled:opacity-50">Approve</button>}
            {driver.applicationStatus === 'pending' && <button onClick={() => updateApplication('reject')} disabled={updating} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 disabled:opacity-50">Reject</button>}
            {driver.applicationStatus === 'approved' && <button onClick={() => updateApplication('suspend')} disabled={updating} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 disabled:opacity-50">Suspend</button>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          {[
            { label: 'Total Rides', value: driver.totalJobs },
            { label: 'Rating', value: driver.rating ? <span className="flex items-center gap-1"><Star size={13} className="text-amber-400" />{driver.rating}</span> : '-' },
            { label: 'Driver Type', value: driver.driverType === 'affiliateDriver' ? 'Affiliate' : 'Independent' },
            { label: 'Joined', value: new Date(driver.joinedDate).toLocaleDateString('en-GB') },
          ].map(item => <div key={item.label} className="p-3 rounded-xl bg-slate-50"><div className="font-bold text-sm flex justify-center">{item.value}</div><p className="text-xs text-slate-400 text-center mt-1">{item.label}</p></div>)}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Application Documents</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {(driver.documents ?? []).map(document => (
            <div key={document.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span className="text-sm">{document.label}</span>
              <div className="text-right">
                <span className="flex items-center justify-end gap-1 text-xs capitalize">{document.status === 'approved' ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-amber-500" />}{document.status}</span>
                {document.fileUrl && <a href={document.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600">View document</a>}
                <div className="flex gap-1 mt-1 flex-wrap justify-end">
                  <button onClick={() => void updateDocument(document.id, 'approve')} className="text-[10px] px-2 py-1 rounded bg-green-600 text-white">Approve</button>
                  {document.status !== 'approved' && (
                    <button onClick={() => void updateDocument(document.id, 'approve', undefined, true)} className="text-[10px] px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">Approve anyway</button>
                  )}
                  <button onClick={() => setRejectDocId(document.id)} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600">Reject</button>
                </div>
              </div>
            </div>
          ))}
          {!driver.documents?.length && <p className="text-sm text-slate-400">No documents uploaded yet.</p>}
        </div>
      </div>

      {driver.driverType === 'independentDriver' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Independent Vehicles</h2>
          {vehicles.map(vehicle => <div key={vehicle.id} className="p-3 rounded-xl bg-slate-50 mb-2"><p className="font-semibold text-sm">{vehicle.make} {vehicle.model}</p><p className="text-xs text-slate-500">{vehicle.registration} · {vehicle.approvalStatus}</p></div>)}
          {!vehicles.length && <p className="text-sm text-slate-400">No vehicle submitted.</p>}
          <Link href="/ops/vehicles" className="inline-block mt-3 text-sm text-blue-600">Open vehicle approvals</Link>
        </div>
      )}

      {rides.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Recent Rides</h2>
          {rides.slice(0, 10).map(ride => (
            <Link key={ride.id} href={`/ops/rides/${ride.id}`} className="grid grid-cols-3 gap-3 p-3 rounded-xl hover:bg-slate-50">
              <span className="font-mono text-sm">{ride.bookingRef}</span>
              <span className="text-xs text-slate-500 truncate">{ride.pickupAddress}</span>
              <span className="font-semibold text-right">£{ride.fareAmount}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
