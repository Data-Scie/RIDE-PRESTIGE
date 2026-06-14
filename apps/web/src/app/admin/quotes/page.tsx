'use client';

import { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminApi } from '@/lib/api-client';
import { formatCurrency, getCategoryLabel } from '@/lib/fare';
import type { VehicleCategory } from '@/types';

interface ApiBooking {
  id: string; reference: string; status: string; createdAt: string;
  customer: { fullName?: string } | null;
  journey: { pickupPostcode?: string; dropoffPostcode?: string; passengers?: number; vehicleCategory?: string } | null;
  vehicleCategory: string; estimatedMiles: number | null; estimatedFare: number | null;
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [selected, setSelected] = useState<ApiBooking | null>(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    // Quotes = bookings with status pending or quoted
    adminApi.get<{ success: boolean; data: ApiBooking[] }>('/api/admin/bookings?limit=100')
      .then(r => setQuotes(r.data.filter(b => ['pending', 'quoted'].includes(b.status))))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      const r = await adminApi.put<{ success: boolean; data: ApiBooking }>(`/api/admin/bookings/${id}`, { status });
      setQuotes(prev => prev.map(q => q.id === id ? r.data : q));
      if (selected?.id === id) setSelected(r.data);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading quotes…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}. Is the backend running?</div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid grid-cols-3 gap-4 mb-2">
        {[
          { label: 'Pending', count: quotes.filter(q => q.status === 'pending').length, color: 'text-amber-600' },
          { label: 'Quoted',  count: quotes.filter(q => q.status === 'quoted').length,  color: 'text-blue-600' },
          { label: 'Total',   count: quotes.length,                                      color: 'text-brand-black' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <p className={`font-display text-3xl font-bold ${color}`}>{count}</p>
            <p className="text-sm text-brand-grey mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className={`grid gap-6 ${selected ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
        <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${selected ? 'lg:col-span-2' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Ref', 'Journey', 'Vehicle', 'Passengers', 'Est. Fare', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotes.map(q => (
                  <tr key={q.id} onClick={() => setSelected(q)}
                    className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selected?.id === q.id ? 'bg-brand-gold/4' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-brand-grey">{q.reference}</td>
                    <td className="px-4 py-3 max-w-40">
                      <p className="text-xs truncate font-mono">{q.journey?.pickupPostcode ?? '?'}</p>
                      <p className="text-xs truncate text-brand-grey font-mono">→ {q.journey?.dropoffPostcode ?? '?'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{getCategoryLabel(q.vehicleCategory as VehicleCategory)}</td>
                    <td className="px-4 py-3 text-xs">{q.journey?.passengers ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-brand-black">
                      {q.estimatedFare ? formatCurrency(q.estimatedFare) : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Eye size={14} className="text-brand-grey" />
                      </button>
                    </td>
                  </tr>
                ))}
                {quotes.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-brand-grey text-sm">No pending quotes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 h-fit">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-brand-grey">{selected.reference}</p>
                <h3 className="font-display text-lg font-semibold text-brand-black mt-0.5">
                  {selected.customer?.fullName ?? 'Unknown customer'}
                </h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-brand-grey hover:text-brand-black text-xl leading-none">×</button>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">Fare estimate</p>
              <div className="flex justify-between py-2 border-t border-gray-100">
                <span className="text-brand-black font-semibold text-sm">Estimated total</span>
                <span className="text-brand-black font-bold">
                  {selected.estimatedFare ? formatCurrency(selected.estimatedFare) : 'Not calculated'}
                </span>
              </div>
              {selected.estimatedMiles && (
                <p className="text-xs text-brand-grey">Distance: ~{selected.estimatedMiles} miles</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateStatus(selected.id, 'accepted')} disabled={saving}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-semibold border border-green-100 hover:bg-green-100 transition-colors">
                  <CheckCircle size={13} /> Accept
                </button>
                <button onClick={() => updateStatus(selected.id, 'rejected')} disabled={saving}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-100 hover:bg-red-100 transition-colors">
                  <XCircle size={13} /> Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
