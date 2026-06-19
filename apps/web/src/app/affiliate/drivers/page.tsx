'use client';

import { useEffect, useState } from 'react';
import { affiliateApi } from '@/lib/api-client';

interface DriverDocument {
  id: string;
  label: string;
  status: string;
  expiryDate?: string | null;
  fileUrl?: string | null;
  rejectionReason?: string | null;
}

interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  totalJobs?: number;
  isApproved?: boolean;
  applicationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  documents?: DriverDocument[];
}

const STATUS_COLOR: Record<string, string> = { available: '#10b981', busy: '#3b82f6', offline: '#94a3b8' };

export default function AffiliateDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);

  const load = async () => {
    const result = await affiliateApi.get<{ success: boolean; data: Driver[] }>('/api/affiliate/drivers');
    setDrivers(result.data);
  };

  useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);

  const submitDocument = async (driverId: string, document: DriverDocument, fileUrl: string, expiryDate: string) => {
    setError('');
    await affiliateApi.put(`/api/affiliate/drivers/${driverId}/documents/${document.id}`, { fileUrl, expiryDate });
    await load();
  };

  const uploadDocument = async (driverId: string, document: DriverDocument, file: File, expiryDate: string) => {
    setError('');
    const form = new FormData();
    form.append('document', file);
    form.append('expiryDate', expiryDate);
    const response = await fetch(`/api/backend/affiliate/drivers/${driverId}/documents/${document.id}/upload`, {
      method: 'POST',
      body: form,
    });
    const payload = await response.json().catch(() => ({ message: 'Upload failed' }));
    if (!response.ok) throw new Error(payload.message || 'Upload failed');
    await load();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading drivers...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Drivers</h1>
        <p className="text-slate-500 text-sm">{drivers.length} registered · {drivers.filter(driver => driver.status === 'available' && driver.isApproved).length} available</p>
        <p className="text-xs text-slate-400 mt-1">Upload driver compliance documents here, or drivers can upload them from their own Driver Portal.</p>
      </div>
      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
        {drivers.map(driver => {
          const applicationStatus = driver.applicationStatus ?? (driver.isApproved ? 'approved' : 'pending');
          return (
            <div key={driver.id} className="px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: STATUS_COLOR[driver.status] ?? '#94a3b8' }}>{driver.fullName.charAt(0)}</div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{driver.fullName}</p>
                  <p className="text-xs text-slate-400">{driver.email} · {driver.phone}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${applicationStatus === 'approved' ? 'bg-green-50 text-green-700' : applicationStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{applicationStatus}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[driver.status] ?? '#94a3b8' }} /><span className="text-xs capitalize text-slate-500">{driver.status}</span></div>
                  <p className="text-xs text-slate-400 mt-1">{driver.totalJobs ?? 0} jobs</p>
                  <button onClick={() => setExpandedDriverId(expandedDriverId === driver.id ? null : driver.id)} className="mt-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold">
                    {expandedDriverId === driver.id ? 'Hide documents' : 'Upload documents'}
                  </button>
                </div>
              </div>
              {expandedDriverId === driver.id && (
                <div className="mt-4 grid md:grid-cols-2 gap-3">
                  {(driver.documents ?? []).map(document => (
                    <DocumentForm
                      key={document.id}
                      document={document}
                      onSubmit={(doc, fileUrl, expiryDate) => submitDocument(driver.id, doc, fileUrl, expiryDate)}
                      onUpload={(doc, file, expiryDate) => uploadDocument(driver.id, doc, file, expiryDate)}
                      onError={setError}
                    />
                  ))}
                  {!driver.documents?.length && <p className="text-sm text-slate-400">No document slots found. Refresh the page and try again.</p>}
                </div>
              )}
            </div>
          );
        })}
        {!drivers.length && <p className="py-12 text-center text-slate-400 text-sm">No drivers have selected your affiliate yet.</p>}
      </div>
    </div>
  );
}

function DocumentForm({
  document,
  onSubmit,
  onUpload,
  onError,
}: {
  document: DriverDocument;
  onSubmit: (document: DriverDocument, fileUrl: string, expiryDate: string) => Promise<void>;
  onUpload: (document: DriverDocument, file: File, expiryDate: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [fileUrl, setFileUrl] = useState(document.fileUrl || '');
  const [expiryDate, setExpiryDate] = useState(document.expiryDate || '');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    onError('');
    try {
      if (file) await onUpload(document, file, expiryDate);
      else await onSubmit(document, fileUrl, expiryDate);
      setFile(null);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Document submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex justify-between gap-3"><p className="font-semibold text-sm">{document.label}</p><span className="text-xs capitalize">{document.status}</span></div>
      {document.rejectionReason && <p className="text-xs text-red-600 mt-1">{document.rejectionReason}</p>}
      {document.fileUrl && <a href={document.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-600">View uploaded document</a>}
      <input type="file" accept=".pdf,image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mt-3 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white" />
      <p className="mt-2 text-[11px] text-slate-400">Or paste a hosted document URL.</p>
      <input type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="Document URL" className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
      <input required type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
      <button onClick={submit} disabled={submitting || !expiryDate || (!file && !fileUrl)} className="mt-2 px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit for review'}</button>
    </div>
  );
}
