'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Car, FileText, Star, Users } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface DriverDocument { id: string; type: string; label: string; status: string; expiryDate?: string | null; fileUrl?: string | null; }
interface AffiliateDriver {
  id: string; fullName: string; email: string; phone: string; status: string;
  rating: number; totalJobs: number; applicationStatus: string; documents: DriverDocument[];
}
interface AffiliateVehicle {
  id: string; make: string; model: string; registration: string; vehicleCategory: string;
  status: string; approvalStatus: string; isApproved: boolean;
}
interface AffiliateDetail {
  id: string; companyName: string; tradingName: string; contactPerson: string;
  email: string; phone: string; address: string; city: string; postcode: string;
  operatorLicenceNumber: string; companyRegNumber: string; vatNumber?: string | null;
  isApproved: boolean; rating: number; totalJobs: number; totalEarnings: number;
  createdAt: string;
  drivers: AffiliateDriver[];
  fleetVehicles: AffiliateVehicle[];
}

export default function AdminAffiliateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<AffiliateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get<{ success: boolean; data: AffiliateDetail }>(`/api/admin/affiliates/${id}`)
      .then(r => setAffiliate(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

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
          <div key={vehicle.id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderBottom: '1px solid #f9f9f9' }}>
            <div>
              <p className="font-medium text-sm" style={{ color: '#0a0f1e' }}>{vehicle.make} {vehicle.model}</p>
              <p className="text-xs text-slate-400 font-mono">{vehicle.registration} · {vehicle.vehicleCategory}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${vehicle.approvalStatus === 'approved' ? 'bg-green-50 text-green-700' : vehicle.approvalStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{vehicle.approvalStatus}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
