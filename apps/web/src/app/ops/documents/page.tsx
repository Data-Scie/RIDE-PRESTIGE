'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Car, FileText, Search, Truck } from 'lucide-react';
import { opsApi } from '@/lib/api-client';

interface DocumentRow {
  id: string;
  documentType: string;
  label: string;
  status: 'missing' | 'pending' | 'approved' | 'rejected' | 'expired';
  fileUrl: string | null;
  expiryDate: string | null;
  rejectionReason: string | null;
  entityKind: 'affiliate' | 'driver' | 'vehicle';
  entityId: string;
  entityName: string;
  affiliateId: string | null;
  affiliateName: string | null;
}

const ENTITY_KINDS = [
  { key: 'all', label: 'All' },
  { key: 'affiliate', label: 'Affiliates' },
  { key: 'driver', label: 'Drivers' },
  { key: 'vehicle', label: 'Vehicles' },
] as const;

const STATUSES = ['all', 'missing', 'pending', 'approved', 'rejected', 'expired'] as const;

const ENTITY_ICON = { affiliate: Building2, driver: Car, vehicle: Truck } as const;
const ENTITY_DETAIL_HREF: Record<DocumentRow['entityKind'], (id: string) => string> = {
  affiliate: id => `/ops/affiliates/${id}`,
  driver: id => `/ops/drivers/${id}`,
  vehicle: () => '/ops/vehicles',
};
const ENTITY_API_SEGMENT: Record<DocumentRow['entityKind'], string> = {
  affiliate: 'affiliates',
  driver: 'drivers',
  vehicle: 'vehicles',
};

const STATUS_STYLE: Record<DocumentRow['status'], string> = {
  approved: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  missing: 'bg-slate-100 text-slate-500',
  rejected: 'bg-red-50 text-red-600',
  expired: 'bg-red-50 text-red-600',
};

export default function OpsDocumentsPage() {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [entityKind, setEntityKind] = useState<typeof ENTITY_KINDS[number]['key']>('all');
  const [status, setStatus] = useState<typeof STATUSES[number]>('all');

  const load = async () => {
    const result = await opsApi.get<{ success: boolean; data: DocumentRow[] }>('/api/ops/documents');
    setRows(result.data);
  };

  useEffect(() => {
    load().catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const updateDocument = async (row: DocumentRow, action: 'approve' | 'reject', override = false) => {
    if (override && !window.confirm('Approve this document without a valid uploaded file? Use this only when you have verified compliance another way.')) return;
    const reason = action === 'reject' ? window.prompt('Reason for rejection?') || 'Document was not approved' : undefined;
    setUpdating(row.id);
    setError('');
    try {
      const segment = ENTITY_API_SEGMENT[row.entityKind];
      await opsApi.put(`/api/ops/${segment}/${row.entityId}/documents/${row.id}/${action}${override ? '?override=true' : ''}`, { reason, override, approveAnyway: override });
      await load();
    } catch (e) {
      setError((e as Error).message || `Could not ${action} document`);
    } finally {
      setUpdating(null);
    }
  };

  const visible = useMemo(() => rows.filter(row => {
    const term = search.toLowerCase();
    const matchesSearch = !term || [row.entityName, row.label, row.affiliateName].some(value => value?.toLowerCase().includes(term));
    const matchesKind = entityKind === 'all' || row.entityKind === entityKind;
    const matchesStatus = status === 'all' || row.status === status;
    return matchesSearch && matchesKind && matchesStatus;
  }), [rows, search, entityKind, status]);

  const counts = useMemo(() => ({
    total: rows.length,
    pending: rows.filter(r => r.status === 'pending' || r.status === 'missing').length,
    approved: rows.filter(r => r.status === 'approved').length,
    rejected: rows.filter(r => r.status === 'rejected' || r.status === 'expired').length,
  }), [rows]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading documents...</div>;

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
        <p className="text-slate-500 text-sm">
          {counts.total} total · {counts.pending} awaiting review · {counts.approved} approved · {counts.rejected} rejected/expired
        </p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search affiliate, driver, vehicle, or document" className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none" />
        </div>
        {ENTITY_KINDS.map(({ key, label }) => (
          <button key={key} onClick={() => setEntityKind(key)} className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: entityKind === key ? '#3b82f6' : '#f8fafc', color: entityKind === key ? 'white' : '#64748b' }}>{label}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-2">
        {STATUSES.map(key => (
          <button key={key} onClick={() => setStatus(key)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize" style={{ background: status === key ? '#0f172a' : '#f1f5f9', color: status === key ? 'white' : '#64748b' }}>{key}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50">
            {['Entity', 'Affiliate', 'Document', 'Status', 'Expiry', 'File', 'Actions'].map(header => <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{header}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map(row => {
              const EntityIcon = ENTITY_ICON[row.entityKind];
              return (
                <tr key={row.id}>
                  <td className="px-4 py-4">
                    <Link href={ENTITY_DETAIL_HREF[row.entityKind](row.entityId)} className="flex items-center gap-2 hover:underline">
                      <EntityIcon size={14} className="text-slate-400" />
                      <span className="font-semibold text-sm">{row.entityName}</span>
                    </Link>
                    <p className="text-xs text-slate-400 capitalize">{row.entityKind}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">{row.affiliateName ?? '-'}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium">{row.label}</p>
                    {row.rejectionReason && <p className="text-xs text-red-600 mt-0.5">{row.rejectionReason}</p>}
                  </td>
                  <td className="px-4 py-4"><span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${STATUS_STYLE[row.status]}`}>{row.status}</span></td>
                  <td className="px-4 py-4 text-sm text-slate-500">{row.expiryDate || 'Not supplied'}</td>
                  <td className="px-4 py-4">
                    {row.fileUrl ? <a href={row.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-semibold flex items-center gap-1"><FileText size={12} /> View</a> : <span className="text-xs text-amber-600">No file</span>}
                  </td>
                  <td className="px-4 py-4"><div className="flex gap-1.5 flex-wrap">
                    <button disabled={updating === row.id || !row.fileUrl || row.status === 'approved'} onClick={() => updateDocument(row, 'approve')} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 disabled:opacity-50">Approve</button>
                    {row.status !== 'approved' && (
                      <button disabled={updating === row.id} onClick={() => updateDocument(row, 'approve', true)} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 disabled:opacity-50">Approve anyway</button>
                    )}
                    {row.status !== 'rejected' && (
                      <button disabled={updating === row.id} onClick={() => updateDocument(row, 'reject')} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 disabled:opacity-50">Reject</button>
                    )}
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!visible.length && <div className="py-16 text-center text-slate-400">No documents match this filter.</div>}
      </div>
    </div>
  );
}
