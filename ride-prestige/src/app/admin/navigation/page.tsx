'use client';

import { useState, useEffect } from 'react';
import { GripVertical, Eye, EyeOff, Edit2, Save, X, Plus } from 'lucide-react';
import { navigation as defaultNav } from '@/lib/data';
import type { NavigationItem } from '@/types';

export default function AdminNavigationPage() {
  const [nav, setNav] = useState<NavigationItem[]>(defaultNav);
  const [editing, setEditing] = useState<NavigationItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/data/navigation').then(r => r.json()).then(({ data }) => { if (data) setNav(data); }).catch(() => {});
  }, []);

  const persistNav = async (updated: NavigationItem[]) => {
    await fetch('/api/admin/data/navigation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {});
  };

  const toggleVisible = async (id: string) => { const u = nav.map(n => n.id === id ? { ...n, visible: !n.visible } : n); setNav(u); await persistNav(u); };

  const startNew = () => {
    setEditing({ id: `nav-${Date.now()}`, label: '', href: '/', visible: true, order: nav.length + 1 });
    setIsNew(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const updated = isNew ? [...nav, editing] : nav.map(n => n.id === editing.id ? editing : n);
    setNav(updated);
    setEditing(null); setIsNew(false);
    await persistNav(updated);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const deleteNav = async (id: string) => { const u = nav.filter(n => n.id !== id); setNav(u); await persistNav(u); };
  const setField = (key: keyof NavigationItem, value: unknown) => setEditing(prev => prev ? { ...prev, [key]: value } : null);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-grey">Drag to reorder. Toggle visibility without removing items.</p>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full font-medium">✓ Saved</span>}
          <button onClick={startNew} className="btn-gold flex items-center gap-2 py-2.5 px-4 text-sm">
            <Plus size={15} /> Add item
          </button>
        </div>
      </div>

      {/* Header CTA note */}
      <div className="bg-brand-gold/8 border border-brand-gold/20 rounded-2xl p-5">
        <p className="text-sm font-medium text-brand-black mb-1">Header CTA Button</p>
        <p className="text-xs text-brand-grey">The &ldquo;Get Quote&rdquo; button in the header always links to <span className="font-mono text-brand-gold">/book</span>. Edit the label in site settings.</p>
      </div>

      {/* Nav items */}
      <div className="space-y-3">
        {nav.sort((a, b) => a.order - b.order).map(item => (
          <div key={item.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 transition-all ${item.visible ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
            <GripVertical size={16} className="text-gray-300 cursor-grab shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="font-medium text-brand-black text-sm">{item.label}</p>
              <p className="text-xs text-brand-grey font-mono">{item.href}</p>
            </div>

            <span className={`text-xs px-2 py-0.5 rounded-full ${item.visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {item.visible ? 'Visible' : 'Hidden'}
            </span>

            <div className="flex items-center gap-1.5">
              <button onClick={() => toggleVisible(item.id)}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-brand-grey">
                {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button onClick={() => { setEditing({ ...item }); setIsNew(false); }}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-brand-grey hover:text-brand-black">
                <Edit2 size={14} />
              </button>
              <button onClick={() => deleteNav(item.id)}
                className="p-2 rounded-xl border border-red-100 hover:bg-red-50 transition-colors text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-4">Navigation preview</p>
        <div className="bg-brand-black rounded-xl p-4 flex items-center gap-2 overflow-x-auto">
          {nav.filter(n => n.visible).sort((a, b) => a.order - b.order).map(item => (
            <span key={item.id} className="px-4 py-2 rounded-lg text-sm text-white/80 border border-white/10 whitespace-nowrap">{item.label}</span>
          ))}
          <span className="ml-auto px-4 py-2 rounded-lg text-sm bg-brand-gold text-brand-black font-semibold whitespace-nowrap shrink-0">Get Quote</span>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-luxury w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display text-xl font-semibold text-brand-black">{isNew ? 'Add menu item' : 'Edit menu item'}</h3>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={18} className="text-brand-grey" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Label *</label>
                <input value={editing.label} onChange={e => setField('label', e.target.value)} className="input-field" placeholder="e.g. Fleet" />
              </div>
              <div>
                <label className="label">Link (href) *</label>
                <input value={editing.href} onChange={e => setField('href', e.target.value)} className="input-field font-mono" placeholder="/fleet" />
              </div>
              <div>
                <label className="label">Display order</label>
                <input type="number" min="1" value={editing.order} onChange={e => setField('order', parseInt(e.target.value))} className="input-field w-24" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.visible} onChange={e => setField('visible', e.target.checked)} className="w-4 h-4 accent-brand-gold" />
                <span className="text-sm text-brand-black font-medium">Visible in navigation</span>
              </label>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={saveEdit} disabled={!editing.label || !editing.href}
                className="btn-gold flex items-center gap-2 flex-1 justify-center py-3 disabled:opacity-50">
                <Save size={15} />
                {isNew ? 'Add item' : 'Save changes'}
              </button>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="btn-outline-gold flex-1 py-3">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
