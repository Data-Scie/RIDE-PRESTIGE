'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Layers, X, Check } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface Attribute {
  id: string; key: string; label: string; type: string;
  options: string[]; category: string; active: boolean;
}

const EMPTY: Omit<Attribute, 'id'> = {
  key: '', label: '', type: 'text', options: [], category: 'vehicle', active: true,
};

const GOLD = '#c9a84c';
const TYPE_OPTIONS   = ['text', 'number', 'boolean', 'select'];
const CAT_OPTIONS    = ['vehicle', 'booking', 'driver'];
const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  vehicle:  { bg: 'rgba(59,130,246,0.08)',  color: '#3b82f6' },
  booking:  { bg: 'rgba(16,185,129,0.08)',  color: '#10b981' },
  driver:   { bg: 'rgba(139,92,246,0.08)',  color: '#8b5cf6' },
};

export default function AttributesPage() {
  const [list, setList]         = useState<Attribute[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [editing, setEditing]   = useState<Partial<Attribute> | null>(null);
  const [saving, setSaving]     = useState(false);
  const [optionsText, setOptionsText] = useState('');

  const load = () =>
    adminApi.get<{ data: Attribute[] }>('/api/admin/attributes')
      .then(r => setList(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing({ ...EMPTY });
    setOptionsText('');
  };
  const openEdit = (a: Attribute) => {
    setEditing({ ...a });
    setOptionsText(a.options.join(', '));
  };
  const close = () => setEditing(null);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        ...editing,
        options: optionsText ? optionsText.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      if (editing.id) {
        await adminApi.put(`/api/admin/attributes/${editing.id}`, payload);
      } else {
        await adminApi.post('/api/admin/attributes', payload);
      }
      await load();
      close();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attribute?')) return;
    try {
      await adminApi.delete(`/api/admin/attributes/${id}`);
      setList(l => l.filter(a => a.id !== id));
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const set = (field: string, value: unknown) => setEditing(prev => ({ ...prev, [field]: value }));

  const grouped = CAT_OPTIONS.reduce<Record<string, Attribute[]>>((acc, cat) => {
    acc[cat] = list.filter(a => a.category === cat);
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD }}>Administration</p>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Attributes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{list.length} attribute{list.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black"
          style={{ background: `linear-gradient(135deg,${GOLD},#e8c96d,#a07c30)`, boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }}>
          <Plus size={15} /> Add Attribute
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Layers size={36} className="mb-3 opacity-30" />
          <p className="text-sm">No attributes yet. Define custom fields for vehicles, bookings or drivers.</p>
        </div>
      )}

      {CAT_OPTIONS.map(cat => grouped[cat].length > 0 && (
        <div key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={CAT_COLORS[cat]}>
              <Layers size={11} style={{ color: CAT_COLORS[cat].color }} />
            </div>
            <span className="text-sm font-semibold capitalize text-slate-700">{cat}</span>
            <span className="ml-auto text-xs text-slate-400">{grouped[cat].length}</span>
          </div>
          {grouped[cat].map((a, i) => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50"
              style={{ borderBottom: i < grouped[cat].length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{a.label}</p>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{a.key}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{a.type}</span>
                  {!a.active && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">Inactive</span>}
                </div>
                {a.options.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">Options: {a.options.join(' · ')}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(a)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100">
                  <Pencil size={13} className="text-slate-500" />
                </button>
                <button onClick={() => handleDelete(a.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>
                {editing.id ? 'Edit Attribute' : 'New Attribute'}
              </h2>
              <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100">
                <X size={15} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Label (display name)</label>
                <input type="text" placeholder="e.g. Vehicle Colour" value={editing.label ?? ''}
                  onChange={e => set('label', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Key (unique identifier)</label>
                <input type="text" placeholder="e.g. vehicle_colour" value={editing.key ?? ''}
                  onChange={e => set('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Type</label>
                  <select value={editing.type ?? 'text'} onChange={e => set('type', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none">
                    {TYPE_OPTIONS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Category</label>
                  <select value={editing.category ?? 'vehicle'} onChange={e => set('category', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none">
                    {CAT_OPTIONS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
              {editing.type === 'select' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Options (comma-separated)</label>
                  <input type="text" placeholder="e.g. Red, Blue, White, Black" value={optionsText}
                    onChange={e => setOptionsText(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none" />
                </div>
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={editing.active ?? true} onChange={e => set('active', e.target.checked)} />
                  <div className="w-10 h-6 rounded-full transition-colors" style={{ background: editing.active ? GOLD : '#e2e8f0' }}>
                    <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: editing.active ? 'translateX(16px)' : 'translateX(0)' }} />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={close} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg,${GOLD},#e8c96d,#a07c30)` }}>
                {saving ? <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" /> : <Check size={14} />}
                {editing.id ? 'Save Changes' : 'Create Attribute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
