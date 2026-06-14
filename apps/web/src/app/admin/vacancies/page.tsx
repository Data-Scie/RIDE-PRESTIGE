'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Briefcase, X, Check } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface Vacancy {
  id: string; title: string; department: string; location: string;
  type: string; description: string; requirements: string;
  salary?: string; active: boolean; createdAt: string;
}

const EMPTY: Omit<Vacancy, 'id' | 'createdAt'> = {
  title: '', department: '', location: '', type: 'full-time',
  description: '', requirements: '', salary: '', active: true,
};

const GOLD = '#c9a84c';
const TYPE_OPTIONS = ['full-time', 'part-time', 'contract', 'freelance'];

export default function VacanciesPage() {
  const [list, setList]       = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [editing, setEditing] = useState<Partial<Vacancy> | null>(null);
  const [saving, setSaving]   = useState(false);

  const load = () =>
    adminApi.get<{ data: Vacancy[] }>('/api/admin/vacancies')
      .then(r => setList(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openNew  = () => setEditing({ ...EMPTY });
  const openEdit = (v: Vacancy) => setEditing({ ...v });
  const close    = () => setEditing(null);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await adminApi.put(`/api/admin/vacancies/${editing.id}`, editing);
      } else {
        await adminApi.post('/api/admin/vacancies', editing);
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
    if (!confirm('Delete this vacancy?')) return;
    try {
      await adminApi.delete(`/api/admin/vacancies/${id}`);
      setList(l => l.filter(v => v.id !== id));
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const set = (field: string, value: unknown) => setEditing(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: GOLD }}>Administration</p>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Vacancies</h1>
          <p className="text-slate-500 text-sm mt-0.5">{list.length} job posting{list.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black"
          style={{ background: `linear-gradient(135deg,${GOLD},#e8c96d,#a07c30)`, boxShadow: `0 4px 16px rgba(201,168,76,0.3)` }}>
          <Plus size={15} /> Add Vacancy
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Briefcase size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No vacancies yet. Add your first job posting.</p>
          </div>
        )}
        {list.map((v, i) => (
          <div key={v.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50"
            style={{ borderBottom: i < list.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(201,168,76,0.08)' }}>
              <Briefcase size={16} style={{ color: GOLD }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-slate-800 text-sm">{v.title}</p>
                <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ background: v.active ? 'rgba(16,185,129,0.08)' : 'rgba(148,163,184,0.15)', color: v.active ? '#10b981' : '#64748b' }}>
                  {v.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{v.department} · {v.location} · <span className="capitalize">{v.type}</span>{v.salary ? ` · ${v.salary}` : ''}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => openEdit(v)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                <Pencil size={13} className="text-slate-500" />
              </button>
              <button onClick={() => handleDelete(v.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                <Trash2 size={13} className="text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>
                {editing.id ? 'Edit Vacancy' : 'New Vacancy'}
              </h2>
              <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100">
                <X size={15} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Job Title', field: 'title', placeholder: 'e.g. Senior Driver' },
                { label: 'Department', field: 'department', placeholder: 'e.g. Operations' },
                { label: 'Location', field: 'location', placeholder: 'e.g. Sheffield, UK' },
                { label: 'Salary (optional)', field: 'salary', placeholder: 'e.g. £28,000–£32,000' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">{label}</label>
                  <input type="text" placeholder={placeholder} value={(editing as Record<string, string>)[field] ?? ''}
                    onChange={e => set(field, e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Employment Type</label>
                <select value={editing.type ?? 'full-time'} onChange={e => set('type', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none">
                  {TYPE_OPTIONS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Description</label>
                <textarea rows={4} placeholder="Job description…" value={editing.description ?? ''}
                  onChange={e => set('description', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Requirements</label>
                <textarea rows={3} placeholder="Required skills, experience…" value={editing.requirements ?? ''}
                  onChange={e => set('requirements', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={editing.active ?? true} onChange={e => set('active', e.target.checked)} />
                  <div className="w-10 h-6 rounded-full transition-colors" style={{ background: editing.active ? GOLD : '#e2e8f0' }}>
                    <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: editing.active ? 'translateX(16px)' : 'translateX(0)' }} />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-700">Active (visible on website)</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={close} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg,${GOLD},#e8c96d,#a07c30)` }}>
                {saving ? <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" /> : <Check size={14} />}
                {editing.id ? 'Save Changes' : 'Create Vacancy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
