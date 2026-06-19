'use client';

import { useEffect, useState } from 'react';
import { FileCheck2 } from 'lucide-react';
import { affiliateApi } from '@/lib/api-client';

type DocumentRecord = {
  id: string;
  label: string;
  status: string;
  expiryDate?: string | null;
  fileUrl?: string | null;
  rejectionReason?: string | null;
};

export default function AffiliateDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const result = await affiliateApi.get<{ success: boolean; data: DocumentRecord[] }>('/api/affiliate/documents');
    setDocuments(result.data);
  };

  useEffect(() => {
    load().catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const submitDocument = async (document: DocumentRecord, fileUrl: string, expiryDate: string) => {
    setError('');
    await affiliateApi.put(`/api/affiliate/documents/${document.id}`, { fileUrl, expiryDate });
    setMessage(`${document.label} submitted for review.`);
    await load();
  };

  const uploadDocument = async (document: DocumentRecord, file: File, expiryDate: string) => {
    setError('');
    const form = new FormData();
    form.append('document', file);
    form.append('expiryDate', expiryDate);
    const response = await fetch(`/api/backend/affiliate/documents/${document.id}/upload`, {
      method: 'POST',
      body: form,
    });
    const payload = await response.json().catch(() => ({ message: 'Upload failed' }));
    if (!response.ok) throw new Error(payload.message || 'Upload failed');
    setMessage(`${document.label} uploaded for review.`);
    await load();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading documents...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Affiliate Documents</h1>
        <p className="text-sm text-slate-500">Upload current compliance documents for operations review.</p>
      </div>
      {message && <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">{message}</div>}
      {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

      <section className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><FileCheck2 size={17} /> Required Documents</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {documents.map(document => (
            <DocumentForm
              key={document.id}
              document={document}
              onSubmit={submitDocument}
              onUpload={uploadDocument}
              onError={setError}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function DocumentForm({
  document,
  onSubmit,
  onUpload,
  onError,
}: {
  document: DocumentRecord;
  onSubmit: (document: DocumentRecord, fileUrl: string, expiryDate: string) => Promise<void>;
  onUpload: (document: DocumentRecord, file: File, expiryDate: string) => Promise<void>;
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
    <div className="p-4 rounded-xl bg-slate-50">
      <div className="flex justify-between gap-3">
        <p className="font-semibold text-sm">{document.label}</p>
        <span className="text-xs capitalize">{document.status}</span>
      </div>
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
