'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Edit2, Save, X, GripVertical, Eye, EyeOff, Bus, Car, Star, Van } from 'lucide-react';
import { fleetCategories as defaultFleet, vehicles as defaultVehicles } from '@/lib/data';
import type { FleetCategory, Vehicle } from '@/types';

const icons: Record<string, ReactNode> = {
  minibus: <Van size={18} />,
  coaches: <Bus size={18} />,
  prestige: <Star size={18} />,
};

async function persist(key: string, value: unknown) {
  await fetch(`/api/admin/data/${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }).catch(() => {});
}

export default function AdminFleetPage() {
  const [fleet, setFleet] = useState<FleetCategory[]>(defaultFleet);
  const [vehicles, setVehicles] = useState<Vehicle[]>(defaultVehicles);
  const [editing, setEditing] = useState<FleetCategory | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/data/categories').then(r => r.json()).then(({ data }) => { if (data) setFleet(data); }).catch(() => {});
    fetch('/api/admin/data/vehicles').then(r => r.json()).then(({ data }) => { if (data) setVehicles(data); }).catch(() => {});
  }, []);

  const toggleAvailability = async (id: string) => {
    const updated = fleet.map(f => f.id === id ? { ...f, available: !f.available } : f);
    setFleet(updated);
    await persist('categories', updated);
  };

  const startEdit = (cat: FleetCategory) => {
    setEditing({ ...cat });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const updated = fleet.map(f => f.id === editing.id ? editing : f);
    setFleet(updated);
    setEditing(null);
    await persist('categories', updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setField = (key: keyof FleetCategory, value: unknown) => {
    setEditing(prev => prev ? { ...prev, [key]: value } : null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-grey">Manage vehicle categories, descriptions, and availability.</p>
        {saved && (
          <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full font-medium">
            ✓ Saved
          </span>
        )}
      </div>

      {/* Fleet cards */}
      <div className="space-y-4">
        {fleet.sort((a, b) => a.order - b.order).map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-4 p-5">
              {/* Drag handle (visual only) */}
              <GripVertical size={16} className="text-gray-300 cursor-grab shrink-0" />

              {/* Icon */}
              <div className="w-12 h-12 bg-brand-gold/8 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-2xl">{icons[cat.slug]}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-display text-lg font-semibold text-brand-black">{cat.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <p className="text-brand-gold text-sm font-medium">{cat.tagline}</p>
                <p className="text-brand-grey text-xs mt-0.5">{cat.description.slice(0, 60)}…</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleAvailability(cat.id)}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-brand-grey hover:text-brand-black"
                  title={cat.available ? 'Mark unavailable' : 'Mark available'}>
                  {cat.available ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => startEdit(cat)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gold/8 hover:bg-brand-gold/15 text-brand-gold text-xs font-semibold transition-colors border border-brand-gold/20">
                  <Edit2 size={13} />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-luxury w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
              <h3 className="font-display text-xl font-semibold text-brand-black">Edit {editing.name}</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X size={18} className="text-brand-grey" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Category name</label>
                  <input value={editing.name} onChange={e => setField('name', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label">Icon label</label>
                  <input value={editing.icon} onChange={e => setField('icon', e.target.value)} className="input-field" placeholder="Car" />
                </div>
              </div>

              <div>
                <label className="label">Tagline</label>
                <input value={editing.tagline} onChange={e => setField('tagline', e.target.value)} className="input-field" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea value={editing.description} onChange={e => setField('description', e.target.value)}
                  rows={3} className="input-field resize-none" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea value={editing.description} onChange={e => setField('description', e.target.value)} rows={2} className="input-field resize-none" />
              </div>

              <div>
                <label className="label">Tagline</label>
                <input value={editing.tagline} onChange={e => setField('tagline', e.target.value)} className="input-field" />
              </div>

              <div>
                <label className="label">Display order</label>
                <input type="number" min="1" value={editing.order}
                  onChange={e => setField('order', parseInt(e.target.value))} className="input-field w-24" />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-3xl">
              <button onClick={saveEdit} className="btn-gold flex items-center gap-2 flex-1 justify-center py-3">
                <Save size={15} />
                Save changes
              </button>
              <button onClick={() => setEditing(null)} className="btn-outline-gold flex-1 py-3">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
