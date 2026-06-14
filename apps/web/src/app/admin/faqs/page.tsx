'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import type { FAQItem } from '@/types';

const CATEGORIES = ['Booking Process', 'Payments & Refunds', 'Vehicle Categories', 'Cancellation Policy', 'Waiting-Time Policy', 'Corporate & Group Bookings', 'Airport Transfers', 'Support & Complaints'];

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FAQItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.get<{ success: boolean; data: FAQItem[] }>('/api/admin/faqs')
      .then(r => setFaqs(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = faqs.filter(f => filterCat === 'all' || f.category === filterCat).sort((a, b) => a.order - b.order);

  const startNew = () => {
    setEditing({ id: '', question: '', answer: '', category: 'Booking Process', order: faqs.length + 1, active: true });
    setIsNew(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (isNew) {
        const { id: _id, ...body } = editing;
        const r = await adminApi.post<{ success: boolean; data: FAQItem }>('/api/admin/faqs', body);
        setFaqs(prev => [...prev, r.data]);
      } else {
        const r = await adminApi.put<{ success: boolean; data: FAQItem }>(`/api/admin/faqs/${editing.id}`, editing);
        setFaqs(prev => prev.map(f => f.id === editing.id ? r.data : f));
      }
      setEditing(null); setIsNew(false);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally { setSaving(false); }
  };

  const deleteFaq = async (id: string) => {
    await adminApi.delete(`/api/admin/faqs/${id}`).catch(() => {});
    setFaqs(prev => prev.filter(f => f.id !== id));
  };

  const toggleActive = async (id: string) => {
    const f = faqs.find(x => x.id === id);
    if (!f) return;
    const r = await adminApi.put<{ success: boolean; data: FAQItem }>(`/api/admin/faqs/${id}`, { active: !f.active }).catch(() => null);
    if (r) setFaqs(prev => prev.map(x => x.id === id ? r.data : x));
    else setFaqs(prev => prev.map(x => x.id === id ? { ...x, active: !x.active } : x));
  };

  const setField = (key: keyof FAQItem, value: unknown) => {
    setEditing(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading FAQs…</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterCat === cat ? 'bg-brand-black text-white' : 'bg-brand-grey-pale text-brand-grey hover:text-brand-black'
              }`}>
              {cat === 'all' ? 'All categories' : cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saved && <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full font-medium">✓ Saved</span>}
          <button onClick={startNew} className="btn-gold flex items-center gap-2 py-2.5 px-4 text-sm">
            <Plus size={15} />
            Add FAQ
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(faq => (
          <div key={faq.id} className={`bg-white rounded-2xl border p-5 transition-all ${faq.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-start gap-3">
              <GripVertical size={16} className="text-gray-300 mt-1 cursor-grab shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-medium text-brand-black text-sm">{faq.question}</p>
                  <span className="text-xs bg-brand-grey-pale text-brand-grey px-2 py-0.5 rounded-full shrink-0">{faq.category}</span>
                </div>
                <p className="text-brand-grey text-xs leading-relaxed line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleActive(faq.id)}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-brand-grey">
                  {faq.active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => { setEditing({ ...faq }); setIsNew(false); }}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-brand-grey hover:text-brand-black">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteFaq(faq.id)}
                  className="p-2 rounded-xl border border-red-100 hover:bg-red-50 transition-colors text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-brand-grey text-sm">
            No FAQs found. Click &ldquo;Add FAQ&rdquo; to create one.
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-luxury w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display text-xl font-semibold text-brand-black">{isNew ? 'Add FAQ' : 'Edit FAQ'}</h3>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={18} className="text-brand-grey" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Category</label>
                <select value={editing.category} onChange={e => setField('category', e.target.value)} className="input-field">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Question *</label>
                <input value={editing.question} onChange={e => setField('question', e.target.value)}
                  placeholder="Enter the FAQ question..." className="input-field" />
              </div>
              <div>
                <label className="label">Answer *</label>
                <textarea value={editing.answer} onChange={e => setField('answer', e.target.value)}
                  rows={5} placeholder="Enter the full answer..." className="input-field resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Display order</label>
                  <input type="number" min="1" value={editing.order} onChange={e => setField('order', parseInt(e.target.value))} className="input-field" />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.active} onChange={e => setField('active', e.target.checked)} className="w-4 h-4 accent-brand-gold" />
                    <span className="text-sm text-brand-black font-medium">Active / visible</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={saveEdit} disabled={saving || !editing.question || !editing.answer}
                className="btn-gold flex items-center gap-2 flex-1 justify-center py-3 disabled:opacity-50">
                <Save size={15} />
                {saving ? 'Saving…' : isNew ? 'Add FAQ' : 'Save changes'}
              </button>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="btn-outline-gold flex-1 py-3">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
