'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, X, Check } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface Course {
  id: string; title: string; description: string; duration: string;
  price?: number; imageUrl?: string; active: boolean; createdAt: string;
}

const EMPTY: Omit<Course, 'id' | 'createdAt'> = {
  title: '', description: '', duration: '', price: undefined, imageUrl: '', active: true,
};

const GOLD = '#c9a84c';

export default function CoursesPage() {
  const [list, setList]       = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [editing, setEditing] = useState<Partial<Course> | null>(null);
  const [saving, setSaving]   = useState(false);

  const load = () =>
    adminApi.get<{ data: Course[] }>('/api/admin/courses')
      .then(r => setList(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openNew  = () => setEditing({ ...EMPTY });
  const openEdit = (c: Course) => setEditing({ ...c });
  const close    = () => setEditing(null);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = { ...editing, price: editing.price ? Number(editing.price) : null };
      if (editing.id) {
        await adminApi.put(`/api/admin/courses/${editing.id}`, payload);
      } else {
        await adminApi.post('/api/admin/courses', payload);
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
    if (!confirm('Delete this course?')) return;
    try {
      await adminApi.delete(`/api/admin/courses/${id}`);
      setList(l => l.filter(c => c.id !== id));
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
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Courses</h1>
          <p className="text-slate-500 text-sm mt-0.5">{list.length} training course{list.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black"
          style={{ background: `linear-gradient(135deg,${GOLD},#e8c96d,#a07c30)`, boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }}>
          <Plus size={15} /> Add Course
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.length === 0 && (
          <div className="md:col-span-3 flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
            <BookOpen size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No courses yet. Add your first training course.</p>
          </div>
        )}
        {list.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {c.imageUrl && (
              <div className="h-32 bg-slate-100 overflow-hidden">
                <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
              </div>
            )}
            {!c.imageUrl && (
              <div className="h-24 flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.05)' }}>
                <BookOpen size={32} style={{ color: GOLD, opacity: 0.4 }} />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-800 text-sm leading-snug">{c.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: c.active ? 'rgba(16,185,129,0.08)' : 'rgba(148,163,184,0.15)', color: c.active ? '#10b981' : '#64748b' }}>
                  {c.active ? 'Active' : 'Off'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{c.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">{c.duration}</p>
                  {c.price != null && <p className="text-sm font-bold" style={{ color: GOLD }}>£{c.price}</p>}
                  {c.price == null && <p className="text-xs text-slate-400">Free</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100">
                    <Pencil size={13} className="text-slate-500" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>
                {editing.id ? 'Edit Course' : 'New Course'}
              </h2>
              <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100">
                <X size={15} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Course Title', field: 'title', placeholder: 'e.g. Defensive Driving' },
                { label: 'Duration', field: 'duration', placeholder: 'e.g. 2 days' },
                { label: 'Image URL (optional)', field: 'imageUrl', placeholder: 'https://…' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">{label}</label>
                  <input type="text" placeholder={placeholder} value={(editing as Record<string, string>)[field] ?? ''}
                    onChange={e => set(field, e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Price (£, leave blank for free)</label>
                <input type="number" min={0} step={0.01} placeholder="0.00" value={editing.price ?? ''}
                  onChange={e => set('price', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Description</label>
                <textarea rows={4} placeholder="Course description…" value={editing.description ?? ''}
                  onChange={e => set('description', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-amber-400 focus:outline-none resize-none" />
              </div>
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
                {editing.id ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
