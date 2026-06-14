'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { adminApi } from '@/lib/api-client';
import type { TicketStatus } from '@/types';

interface ApiTicket {
  id: string; reference?: string; subject: string; message: string; status: string;
  type: string; bookingReference?: string; adminNotes?: string;
  customerData: { name?: string; email?: string; phone?: string } | null;
  createdAt: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets]   = useState<ApiTicket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState<ApiTicket | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    adminApi.get<{ success: boolean; data: ApiTicket[] }>('/api/admin/support')
      .then(r => setTickets(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const updateStatus = async (id: string, status: TicketStatus) => {
    setSaving(true);
    try {
      const r = await adminApi.put<{ success: boolean; data: ApiTicket }>(`/api/admin/support/${id}`, { status });
      setTickets(prev => prev.map(t => t.id === id ? r.data : t));
      if (selected?.id === id) setSelected(r.data);
    } finally { setSaving(false); }
  };

  const saveNote = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await adminApi.put<{ success: boolean; data: ApiTicket }>(`/api/admin/support/${selected.id}`, { adminNotes: adminNote });
      setTickets(prev => prev.map(t => t.id === selected.id ? r.data : t));
      setSelected(r.data);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading tickets…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}. Is the backend running?</div>;

  const customerName  = (t: ApiTicket) => t.customerData?.name  ?? '—';
  const customerEmail = (t: ApiTicket) => t.customerData?.email ?? '';

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open',        count: tickets.filter(t => t.status === 'open').length,        icon: AlertCircle,  color: 'text-red-500',  bg: 'bg-red-50'  },
          { label: 'In Progress', count: tickets.filter(t => t.status === 'in_progress').length, icon: Clock,        color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Resolved',    count: tickets.filter(t => t.status === 'resolved').length,    icon: CheckCircle,  color: 'text-green-600',bg: 'bg-green-50'},
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-brand-black">{count}</p>
              <p className="text-xs text-brand-grey">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'resolved'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                filterStatus === s ? 'bg-brand-black text-white' : 'bg-brand-grey-pale text-brand-grey hover:text-brand-black'
              }`}>
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
        <div className={`space-y-3 ${selected ? 'lg:col-span-2' : ''}`}>
          {filtered.map(ticket => (
            <div key={ticket.id} onClick={() => { setSelected(ticket); setAdminNote(ticket.adminNotes || ''); }}
              className={`bg-white rounded-2xl border p-5 cursor-pointer hover:border-brand-gold/25 transition-all duration-200 ${selected?.id === ticket.id ? 'border-brand-gold/40 shadow-gold' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    ticket.status === 'open' ? 'bg-red-50' : ticket.status === 'in_progress' ? 'bg-blue-50' : 'bg-green-50'
                  }`}>
                    <MessageSquare size={14} className={
                      ticket.status === 'open' ? 'text-red-500' : ticket.status === 'in_progress' ? 'text-blue-600' : 'text-green-600'
                    } />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-brand-black">{ticket.subject}</p>
                    <p className="text-xs text-brand-grey">{customerName(ticket)} · {customerEmail(ticket)}</p>
                    {ticket.bookingReference && (
                      <p className="text-xs text-brand-gold font-mono mt-0.5">{ticket.bookingReference}</p>
                    )}
                    <p className="text-xs text-brand-grey/60 mt-1 line-clamp-2">{ticket.message}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={ticket.status} />
                  <span className="text-[10px] text-brand-grey capitalize">{ticket.type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-brand-grey text-sm">No tickets found</div>
          )}
        </div>

        {selected && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 h-fit">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-brand-grey">{selected.reference ?? selected.id.slice(0, 8)}</p>
                <h3 className="font-display text-base font-semibold text-brand-black mt-0.5">{selected.subject}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-brand-grey hover:text-brand-black text-xl">×</button>
            </div>

            <div className="text-sm space-y-1">
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider">Customer</p>
              <p className="text-brand-black">{customerName(selected)}</p>
              <p className="text-brand-grey">{customerEmail(selected)}</p>
              {selected.customerData?.phone && <p className="text-brand-grey">{selected.customerData.phone}</p>}
            </div>

            <div className="text-sm">
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-2">Message</p>
              <p className="text-brand-grey leading-relaxed text-xs bg-gray-50 rounded-xl p-4">{selected.message}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-2">Update status</p>
              <div className="grid grid-cols-3 gap-1.5">
                {(['open', 'in_progress', 'resolved'] as TicketStatus[]).map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} disabled={saving}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                      selected.status === s ? 'bg-brand-black text-white border-brand-black' : 'border-gray-200 text-brand-grey hover:border-gray-300'
                    }`}>
                    {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-2">Admin notes</p>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                rows={3} placeholder="Internal notes…" className="input-field resize-none text-xs" />
              <button onClick={saveNote} disabled={saving} className="mt-2 btn-gold w-full py-2 text-xs">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
