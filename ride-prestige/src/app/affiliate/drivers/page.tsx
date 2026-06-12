'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { affiliateApi } from '@/lib/api-client';

interface Driver {
  id: string; fullName: string; email: string; phone: string;
  status: string; licencePlate?: string; totalJobs?: number;
}

const STATUS_COLOR: Record<string, string> = { available: '#10b981', busy: '#3b82f6', offline: '#94a3b8' };

export default function AffiliateDriversPage() {
  const [drivers, setDrivers]   = useState<Driver[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]         = useState({ fullName: '', email: '', phone: '', licencePlate: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    affiliateApi.get<{ success: boolean; data: Driver[] }>('/api/affiliate/drivers')
      .then(r => setDrivers(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const addDriver = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await affiliateApi.post<{ success: boolean; data: Driver }>('/api/affiliate/drivers', form);
      setDrivers(prev => [...prev, r.data]);
      setForm({ fullName: '', email: '', phone: '', licencePlate: '' });
      setModal(false);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally { setSubmitting(false); }
  };

  const removeDriver = async (id: string) => {
    await affiliateApi.put(`/api/affiliate/drivers/${id}/remove`, {});
    setDrivers(prev => prev.filter(d => d.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading drivers…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>;

  const onlineCount = drivers.filter(d => d.status !== 'offline').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>My Drivers</h1>
          <p className="text-slate-500 text-sm">{onlineCount} online · {drivers.length} total</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ background: '#10b981' }}>
          <Plus size={15} /> Add Driver
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
        {drivers.map(d => (
          <div key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: STATUS_COLOR[d.status] ?? '#94a3b8' }}>{d.fullName.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800">{d.fullName}</p>
              <p className="text-xs text-slate-400">{d.licencePlate || d.email}</p>
            </div>
            <div className="flex items-center gap-1.5 mr-3">
              <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[d.status] ?? '#94a3b8' }} />
              <span className="text-xs capitalize" style={{ color: STATUS_COLOR[d.status] ?? '#94a3b8' }}>{d.status}</span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => removeDriver(d.id)} className="p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {drivers.length === 0 && <p className="py-12 text-center text-slate-400 text-sm">No drivers added yet</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Add Driver</h3>
              <button onClick={() => setModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={addDriver} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Full name *</label>
                  <input required value={form.fullName} onChange={e => set('fullName', e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" placeholder="Driver full name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Email *</label>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" placeholder="driver@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Phone *</label>
                  <input required value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" placeholder="+44 7700…" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Licence plate</label>
                  <input value={form.licencePlate} onChange={e => set('licencePlate', e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" placeholder="SH21 ABC" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-60" style={{ background: '#10b981' }}>
                  <Save size={14} /> {submitting ? 'Adding…' : 'Add Driver'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl font-semibold text-sm" style={{ background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
