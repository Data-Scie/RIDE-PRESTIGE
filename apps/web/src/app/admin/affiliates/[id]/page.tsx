'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Car, FileText, Star, Users } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface DriverDocument { id: string; type?: string; label: string; status: string; expiryDate?: string | null; fileUrl?: string | null; rejectionReason?: string | null; }
interface AffiliateDriver {
  id: string; fullName: string; email: string; phone: string; status: string;
  rating: number; totalJobs: number; applicationStatus: string; documents: DriverDocument[];
}
interface AffiliateVehicle {
  id: string; make: string; model: string; registration: string; vehicleCategory: string;
  status: string; approvalStatus: string; isApproved: boolean;
  documents?: DriverDocument[];
}
interface AffiliateDetail {
  id: string; companyName: string; tradingName: string; contactPerson: string;
  email: string; phone: string; address: string; city: string; postcode: string;
  operatorLicenceNumber: string; companyRegNumber: string; vatNumber?: string | null;
  isApproved: boolean; rating: number; totalJobs: number; totalEarnings: number;
  createdAt: string;
  drivers: AffiliateDriver[];
  fleetVehicles: AffiliateVehicle[];
  documents: DriverDocument[];
}

export default function AdminAffiliateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<AffiliateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingDocument, setUpdatingDocument] = useState<string | null>(null);

  const load = async () => {
    const result = await adminApi.get<{ success: boolean; data: AffiliateDetail }>(`/api/admin/affiliates/${id}`);
    setAffiliate(result.data);
  };

  useEffect(() => {
    load()
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const updateDocument = async (documentId: string, action: 'approve' | 'reject', override = false) => {
    const reason = action === 'reject' ? window.prompt('Reason for rejection?') || 'Document was not approved' : undefined;
    if (override && !window.confirm('Approve this document without a valid uploaded file? Use this only when you have verified compliance another way.')) return;
    setUpdatingDocument(documentId);
    setError('');
    try {
      await adminApi.put(`/api/admin/affiliates/${id}/documents/${documentId}/${action}${override ? '?override=true' : ''}`, { reason, override, approveAnyway: override });
      await load();
    } catch (e) {
      setError((e as Error).message || 'Could not update document');
    } finally {
      setUpdatingDocument(null);
    }
  };

  const updateVehicleDocument = async (vehicleId: string, documentId: string, action: 'approve' | 'reject', override = false) => {
    const reason = action === 'reject' ? window.prompt('Reason for rejection?') || 'Vehicle document was not approved' : undefined;
    if (override && !window.confirm('Approve this document without a valid uploaded file? Use this only when you have verified compliance another way.')) return;
    setUpdatingDocument(documentId);
    setError('');
    try {
      await adminApi.put(`/api/admin/vehicles/${vehicleId}/documents/${documentId}/${action}${override ? '?override=true' : ''}`, { reason, override, approveAnyway: override });
      await load();
    } catch (e) {
      setError((e as Error).message || 'Could not update vehicle document');
    } finally {
      setUpdatingDocument(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading affiliate...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!affiliate) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      <button onClick={() => router.push('/admin/affiliates')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back to affiliates
      </button>

      <div className="bg-white rounded-2xl p-6 flex items-start justify-between gap-4 flex-wrap" style={{ border: '1px solid #f0f0f0' }}>
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.08)' }}>
            <Building2 size={24} style={{ color: '#c9a84c' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>{affiliate.companyName}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${affiliate.isApproved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{affiliate.isApproved ? 'Approved' : 'Pending'}</span>
            </div>
            <p className="text-sm text-slate-500">{affiliate.tradingName} · {affiliate.contactPerson}</p>
            <p className="text-xs text-slate-400 mt-1">{affiliate.email} · {affiliate.phone}</p>
            <p className="text-xs text-slate-400">{affiliate.address}, {affiliate.city} {affiliate.postcode}</p>
            <p className="text-xs text-slate-400 mt-1">Operator licence {affiliate.operatorLicenceNumber} · Company reg {affiliate.companyRegNumber}{affiliate.vatNumber ? ` · VAT ${affiliate.vatNumber}` : ''}</p>
          </div>
        </div>
        <div className="flex gap-6 text-right">
          <div><p className="text-lg font-bold flex items-center gap-1 justify-end" style={{ color: '#0a0f1e' }}><Star size={14} className="text-amber-400" />{affiliate.rating || '—'}</p><p className="text-xs text-slate-400">Rating</p></div>
          <div><p className="text-lg font-bold" style={{ color: '#0a0f1e' }}>{affiliate.totalJobs}</p><p className="text-xs text-slate-400">Total jobs</p></div>
          <div><p className="text-lg font-bold" style={{ color: '#0a0f1e' }}>£{affiliate.totalEarnings.toLocaleString()}</p><p className="text-xs text-slate-400">Earnings</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f9f9f9' }}>
          <FileText size={16} style={{ color: '#c9a84c' }} />
          <h2 className="font-semibold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>Affiliate Documents ({affiliate.documents?.length ?? 0})</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 p-6">
          {(affiliate.documents ?? []).map(doc => (
            <div key={doc.id} className="p-4 rounded-xl bg-slate-50">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-medium text-sm" style={{ color: '#0a0f1e' }}>{doc.label}</p>
                  <p className="text-xs text-slate-400 capitalize">{doc.status}{doc.expiryDate ? ` - expires ${new Date(doc.expiryDate).toLocaleDateString('en-GB')}` : ''}</p>
                  {doc.rejectionReason && <p className="text-xs text-red-600 mt-1">{doc.rejectionReason}</p>}
                  {doc.fileUrl && <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 mt-2 inline-block">View document</a>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full h-fit font-semibold capitalize ${doc.status === 'approved' ? 'bg-green-50 text-green-700' : doc.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{doc.status}</span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button disabled={updatingDocument === doc.id} onClick={() => void updateDocument(doc.id, 'approve')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 disabled:opacity-50">Approve</button>
                {doc.status !== 'approved' && (
                  <button disabled={updatingDocument === doc.id} onClick={() => void updateDocument(doc.id, 'approve', true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 disabled:opacity-50">Approve anyway</button>
                )}
                <button disabled={updatingDocument === doc.id} onClick={() => void updateDocument(doc.id, 'reject')} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 disabled:opacity-50">Reject</button>
              </div>
            </div>
          ))}
          {!affiliate.documents?.length && <p className="text-sm text-slate-400">No affiliate documents submitted yet.</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f9f9f9' }}>
          <Users size={16} style={{ color: '#c9a84c' }} />
          <h2 className="font-semibold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>Drivers ({affiliate.drivers.length})</h2>
        </div>
        {!affiliate.drivers.length && <p className="px-6 py-8 text-sm text-slate-400">No drivers yet.</p>}
        {affiliate.drivers.map(driver => (
          <div key={driver.id} className="px-6 py-4 flex items-start justify-between gap-4 flex-wrap" style={{ borderBottom: '1px solid #f9f9f9' }}>
            <div>
              <p className="font-medium text-sm" style={{ color: '#0a0f1e' }}>{driver.fullName}</p>
              <p className="text-xs text-slate-400">{driver.email} · {driver.phone}</p>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {driver.documents.map(doc => (
                  <span key={doc.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${doc.status === 'approved' ? 'bg-green-50 text-green-700' : doc.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    <FileText size={9} /> {doc.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${driver.applicationStatus === 'approved' ? 'bg-green-50 text-green-700' : driver.applicationStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{driver.applicationStatus}</span>
              <p className="text-xs text-slate-400 mt-1">{driver.totalJobs} rides · {driver.rating || 'Not rated'}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f9f9f9' }}>
          <Car size={16} style={{ color: '#c9a84c' }} />
          <h2 className="font-semibold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>Vehicles ({affiliate.fleetVehicles.length})</h2>
        </div>
        {!affiliate.fleetVehicles.length && <p className="px-6 py-8 text-sm text-slate-400">No vehicles yet.</p>}
        {affiliate.fleetVehicles.map(vehicle => (
          <div key={vehicle.id} className="px-6 py-4" style={{ borderBottom: '1px solid #f9f9f9' }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-sm" style={{ color: '#0a0f1e' }}>{vehicle.make} {vehicle.model}</p>
                <p className="text-xs text-slate-400 font-mono">{vehicle.registration} · {vehicle.vehicleCategory}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${vehicle.approvalStatus === 'approved' ? 'bg-green-50 text-green-700' : vehicle.approvalStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{vehicle.approvalStatus}</span>
            </div>
            {!!vehicle.documents?.length && (
              <div className="mt-3 grid sm:grid-cols-3 gap-2">
                {vehicle.documents.map(doc => (
                  <div key={doc.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">{doc.label}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{doc.status}{doc.expiryDate ? ` - expires ${new Date(doc.expiryDate).toLocaleDateString('en-GB')}` : ''}</p>
                    {doc.rejectionReason && <p className="mt-1 text-[11px] text-red-600">{doc.rejectionReason}</p>}
                    {doc.fileUrl && <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-blue-600">View document</a>}
                    <div className="mt-2 flex gap-1 flex-wrap">
                      <button disabled={updatingDocument === doc.id} onClick={() => void updateVehicleDocument(vehicle.id, doc.id, 'approve')} className="rounded-lg bg-green-600 px-2 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50">Approve</button>
                      {doc.status !== 'approved' && (
                        <button disabled={updatingDocument === doc.id} onClick={() => void updateVehicleDocument(vehicle.id, doc.id, 'approve', true)} className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-[11px] font-semibold text-amber-700 disabled:opacity-50">Approve anyway</button>
                      )}
                      <button disabled={updatingDocument === doc.id} onClick={() => void updateVehicleDocument(vehicle.id, doc.id, 'reject')} className="rounded-lg bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-600 disabled:opacity-50">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
