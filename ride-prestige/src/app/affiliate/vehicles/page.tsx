'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Car } from 'lucide-react';
import { affiliateApi } from '@/lib/api-client';

interface Vehicle {
  id: string; make: string; model: string; registration: string;
  colour: string; vehicleType: string; capacity: number; isAvailable: boolean;
}

export default function AffiliateVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ make: '', model: '', registration: '', colour: '', vehicleType: 'saloon', capacity: '4' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    affiliateApi.get<{ success: boolean; data: Vehicle[] }>('/api/affiliate/vehicles')
      .then(r => setVehicles(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const addVehicle = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await affiliateApi.post<{ success: boolean; data: Vehicle }>('/api/affiliate/vehicles', { ...form, capacity: parseInt(form.capacity) });
      setVehicles(prev => [...prev, r.data]);
      setForm({ make: '', model: '', registration: '', colour: '', vehicleType: 'saloon', capacity: '4' });
      setModal(false);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally { setSubmitting(false); }
  };

  const removeVehicle = async (id: string) => {
    await affiliateApi.put(`/api/affiliate/vehicles/${id}/remove`, {});
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading vehicles…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>;

  const availableCount = vehicles.filter(v => v.isAvailable).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>My Vehicles</h1>
          <p className="text-slate-500 text-sm">{availableCount} available · {vehicles.length} total</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ background: '#10b981' }}>
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: v.isAvailable ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)' }}>
                <Car size={22} style={{ color: v.isAvailable ? '#10b981' : '#94a3b8' }} />
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.isAvailable ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{v.isAvailable ? 'Available' : 'On ride'}</span>
            </div>
            <h3 className="font-bold text-slate-800">{v.make} {v.model}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{v.registration} · {v.colour} · {v.vehicleType}</p>
            <p className="text-xs text-slate-400 mt-0.5">{v.capacity} seats</p>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => removeVehicle(v.id)} className="ml-auto p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {vehicles.length === 0 && <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-400 text-sm">No vehicles added yet</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Add Vehicle</h3>
              <button onClick={() => setModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={addVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Make *</label>
                  <input required value={form.make} onChange={e => set('make', e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" placeholder="Mercedes" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Model *</label>
                  <input required value={form.model} onChange={e => set('model', e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" placeholder="E-Class" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Registration *</label>
                  <input required value={form.registration} onChange={e => set('registration', e.target.value.toUpperCase())} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" placeholder="SH21 ABC" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Colour</label>
                  <input value={form.colour} onChange={e => set('colour', e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" placeholder="Black" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Type</label>
                  <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400">
                    {['saloon','estate','mpv','executive','minibus','coach'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Seats</label>
                  <input type="number" min="1" max="70" value={form.capacity} onChange={e => set('capacity', e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-green-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-60" style={{ background: '#10b981' }}>
                  <Save size={14} /> {submitting ? 'Adding…' : 'Add Vehicle'}
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
