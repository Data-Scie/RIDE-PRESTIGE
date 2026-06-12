'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
import { promotions as defaultPromos } from '@/lib/data';
import type { Promotion, VehicleCategory } from '@/types';

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>(defaultPromos);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/data/promotions').then(r => r.json()).then(({ data }) => { if (data) setPromos(data); }).catch(() => {});
  }, []);

  const persistPromos = async (updated: Promotion[]) => {
    await fetch('/api/admin/data/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {});
  };

  const startNew = () => {
    setEditing({
      id: `promo-${Date.now()}`, title: '', description: '', couponCode: '',
      discountType: 'percentage', discountValue: 10,
      startDate: '2026-01-01', endDate: '2026-12-31',
      active: true, terms: '', category: 'all',
    });
    setIsNew(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const updated = isNew ? [...promos, editing] : promos.map(p => p.id === editing.id ? editing : p);
    setPromos(updated);
    setEditing(null); setIsNew(false);
    await persistPromos(updated);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const deletePromo = async (id: string) => { const u = promos.filter(p => p.id !== id); setPromos(u); await persistPromos(u); };
  const toggleActive = async (id: string) => { const u = promos.map(p => p.id === id ? { ...p, active: !p.active } : p); setPromos(u); await persistPromos(u); };
  const setField = (key: keyof Promotion, value: unknown) => setEditing(prev => prev ? { ...prev, [key]: value } : null);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-grey">{promos.filter(p => p.active).length} active promotion{promos.filter(p => p.active).length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full font-medium">✓ Saved</span>}
          <button onClick={startNew} className="btn-gold flex items-center gap-2 py-2.5 px-4 text-sm">
            <Plus size={15} /> Add promotion
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {promos.map(promo => (
          <div key={promo.id} className={`bg-white rounded-2xl border p-6 transition-all ${promo.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center shrink-0">
                <Tag size={20} className="text-brand-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-brand-black">{promo.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${promo.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {promo.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-brand-grey text-sm mt-0.5">{promo.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-2xl font-bold text-brand-black">
                      {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `£${promo.discountValue}`}
                    </p>
                    <p className="text-xs text-brand-grey">discount</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  {promo.couponCode && (
                    <span className="font-mono text-xs bg-brand-grey-pale border border-gray-200 px-3 py-1 rounded-lg">{promo.couponCode}</span>
                  )}
                  <span className="text-xs text-brand-grey">Valid: {promo.startDate} — {promo.endDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(promo.id)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${promo.active ? 'bg-brand-gold' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${promo.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <button onClick={() => { setEditing({ ...promo }); setIsNew(false); }}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-brand-grey hover:text-brand-black">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deletePromo(promo.id)}
                  className="p-2 rounded-xl border border-red-100 hover:bg-red-50 transition-colors text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {promos.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-brand-grey text-sm">
            No promotions yet. Click &ldquo;Add promotion&rdquo; to create one.
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-luxury w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
              <h3 className="font-display text-xl font-semibold text-brand-black">{isNew ? 'Add promotion' : 'Edit promotion'}</h3>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={18} className="text-brand-grey" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input value={editing.title} onChange={e => setField('title', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={editing.description} onChange={e => setField('description', e.target.value)} rows={2} className="input-field resize-none" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Discount type</label>
                  <select value={editing.discountType} onChange={e => setField('discountType', e.target.value)} className="input-field">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (£)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Discount value</label>
                  <input type="number" min="0" value={editing.discountValue} onChange={e => setField('discountValue', parseFloat(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="label">Coupon code</label>
                  <input value={editing.couponCode || ''} onChange={e => setField('couponCode', e.target.value.toUpperCase())} className="input-field font-mono" placeholder="SAVE20" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Start date</label>
                  <input type="date" value={editing.startDate} onChange={e => setField('startDate', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label">End date</label>
                  <input type="date" value={editing.endDate} onChange={e => setField('endDate', e.target.value)} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Applies to</label>
                <select value={editing.category || 'all'} onChange={e => setField('category', e.target.value)} className="input-field">
                  <option value="all">All categories</option>
                  <option value="minibus">Minibus</option>
                  <option value="coaches">Coaches</option>
                  <option value="prestige">Prestige Vehicles</option>
                </select>
              </div>
              <div>
                <label className="label">Terms & conditions</label>
                <textarea value={editing.terms} onChange={e => setField('terms', e.target.value)} rows={3} className="input-field resize-none text-xs" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.active} onChange={e => setField('active', e.target.checked)} className="w-4 h-4 accent-brand-gold" />
                <span className="text-sm text-brand-black font-medium">Active (visible on website)</span>
              </label>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-3xl">
              <button onClick={saveEdit} disabled={!editing.title}
                className="btn-gold flex items-center gap-2 flex-1 justify-center py-3 disabled:opacity-50">
                <Save size={15} />
                {isNew ? 'Add promotion' : 'Save changes'}
              </button>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="btn-outline-gold flex-1 py-3">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
