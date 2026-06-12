'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff, Car, Bus, Van, Star } from 'lucide-react';
import { vehicles as defaultVehicles } from '@/lib/data';
import type { Vehicle, VehicleCategory } from '@/types';

const CATEGORIES: { slug: VehicleCategory; name: string }[] = [
  { slug: 'prestige', name: 'Prestige' },
  { slug: 'minibus', name: 'Minibus' },
  { slug: 'coaches', name: 'Coaches' },
  { slug: 'taxi', name: 'Taxi' },
];

const CAT_ICON: Record<VehicleCategory, React.ReactNode> = {
  prestige: <Star size={14} />,
  minibus: <Van size={14} />,
  coaches: <Bus size={14} />,
  taxi: <Car size={14} />,
};

const emptyVehicle = (): Omit<Vehicle, 'id'> => ({
  categorySlug: 'prestige',
  name: '',
  description: '',
  passengers: 4,
  luggage: '',
  features: [],
  imageUrl: '',
  available: true,
  priceNote: '',
  badge: '',
});

async function persist(vehicles: Vehicle[]) {
  await fetch('/api/admin/data/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicles),
  }).catch(() => {});
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(defaultVehicles);
  const [filterCat, setFilterCat] = useState<VehicleCategory | 'all'>('all');
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [featuresInput, setFeaturesInput] = useState('');

  useEffect(() => {
    fetch('/api/admin/data/vehicles')
      .then(r => r.json())
      .then(({ data }) => { if (data) setVehicles(data); })
      .catch(() => {});
  }, []);

  const filtered = filterCat === 'all'
    ? vehicles
    : vehicles.filter(v => v.categorySlug === filterCat);

  const startNew = () => {
    setEditing({ id: `v-${Date.now()}`, ...emptyVehicle() });
    setFeaturesInput('');
    setIsNew(true);
  };

  const startEdit = (v: Vehicle) => {
    setEditing({ ...v });
    setFeaturesInput(v.features.join(', '));
    setIsNew(false);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const vehicle: Vehicle = {
      ...editing,
      features: featuresInput.split(',').map(f => f.trim()).filter(Boolean),
    };
    const updated = isNew
      ? [...vehicles, vehicle]
      : vehicles.map(v => v.id === vehicle.id ? vehicle : v);
    setVehicles(updated);
    setEditing(null);
    setIsNew(false);
    await persist(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteVehicle = async (id: string) => {
    const updated = vehicles.filter(v => v.id !== id);
    setVehicles(updated);
    await persist(updated);
  };

  const toggleAvailability = async (id: string) => {
    const updated = vehicles.map(v => v.id === id ? { ...v, available: !v.available } : v);
    setVehicles(updated);
    await persist(updated);
  };

  const setField = (key: keyof Vehicle, value: unknown) =>
    setEditing(prev => prev ? { ...prev, [key]: value } : null);

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-black mb-1">Vehicle Manager</h1>
          <p className="text-sm text-brand-grey">
            {vehicles.filter(v => v.available).length} active · {vehicles.length} total vehicles
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full font-medium">
              ✓ Saved to website
            </span>
          )}
          <button onClick={startNew} className="btn-gold flex items-center gap-2 py-2.5 px-4 text-sm">
            <Plus size={15} /> Add vehicle
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {[{ slug: 'all' as const, name: 'All Vehicles' }, ...CATEGORIES].map(c => (
          <button
            key={c.slug}
            onClick={() => setFilterCat(c.slug)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterCat === c.slug
                ? 'bg-brand-black text-white'
                : 'bg-brand-grey-pale text-brand-grey hover:text-brand-black'
            }`}
          >
            {c.slug !== 'all' && CAT_ICON[c.slug as VehicleCategory]}
            {c.name}
            {c.slug !== 'all' && (
              <span className="opacity-55">({vehicles.filter(v => v.categorySlug === c.slug).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Vehicle list */}
      <div className="space-y-3">
        {filtered.map(vehicle => (
          <div
            key={vehicle.id}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-4 transition-all ${
              vehicle.available ? 'border-gray-100' : 'border-gray-100 opacity-55'
            }`}
          >
            {/* Thumbnail */}
            <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {vehicle.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vehicle.imageUrl}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car size={20} className="text-gray-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="font-semibold text-brand-black text-sm">{vehicle.name}</p>
                {vehicle.badge && (
                  <span className="text-xs bg-brand-gold/10 text-brand-gold border border-brand-gold/20 px-2 py-0.5 rounded-full">
                    {vehicle.badge}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  vehicle.available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {vehicle.available ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <p className="text-xs text-brand-grey mb-0.5">
                {CATEGORIES.find(c => c.slug === vehicle.categorySlug)?.name} &middot; {vehicle.passengers} passengers &middot; {vehicle.luggage}
              </p>
              <p className="text-xs text-brand-grey line-clamp-1 max-w-xl">{vehicle.description}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => toggleAvailability(vehicle.id)}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-brand-grey"
                title={vehicle.available ? 'Hide from website' : 'Show on website'}
              >
                {vehicle.available ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={() => startEdit(vehicle)}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-brand-grey hover:text-brand-black"
                title="Edit vehicle"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => deleteVehicle(vehicle.id)}
                className="p-2 rounded-xl border border-red-100 hover:bg-red-50 transition-colors text-red-400 hover:text-red-600"
                title="Delete vehicle"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-brand-grey text-sm">
            No vehicles in this category. Click &ldquo;Add vehicle&rdquo; to create one.
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-luxury w-full max-w-2xl max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="font-display text-xl font-semibold text-brand-black">
                {isNew ? 'Add vehicle' : `Edit · ${editing.name}`}
              </h3>
              <button
                onClick={() => { setEditing(null); setIsNew(false); }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-brand-grey" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Name + Category */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Vehicle name *</label>
                  <input
                    value={editing.name}
                    onChange={e => setField('name', e.target.value)}
                    className="input-field"
                    placeholder="e.g. Range Rover"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select
                    value={editing.categorySlug}
                    onChange={e => setField('categorySlug', e.target.value)}
                    className="input-field"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Passengers + Luggage + Badge */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Passengers</label>
                  <input
                    type="number" min="1" max="100"
                    value={editing.passengers}
                    onChange={e => setField('passengers', parseInt(e.target.value) || 1)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Luggage</label>
                  <input
                    value={editing.luggage}
                    onChange={e => setField('luggage', e.target.value)}
                    className="input-field"
                    placeholder="e.g. 3 large cases"
                  />
                </div>
                <div>
                  <label className="label">Badge (optional)</label>
                  <input
                    value={editing.badge || ''}
                    onChange={e => setField('badge', e.target.value)}
                    className="input-field"
                    placeholder="e.g. Most Popular"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description *</label>
                <textarea
                  value={editing.description}
                  onChange={e => setField('description', e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Describe this vehicle — what makes it special, who it's ideal for..."
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="label">Image URL</label>
                <input
                  value={editing.imageUrl || ''}
                  onChange={e => setField('imageUrl', e.target.value)}
                  className="input-field"
                  placeholder="https://images.unsplash.com/photo-..."
                />
                <p className="text-xs text-brand-grey mt-1">
                  Paste a direct image link from Unsplash, Pexels, or upload to{' '}
                  <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-brand-gold underline">imgbb.com</a> (free)
                </p>
                {editing.imageUrl && (
                  <div className="mt-2 w-full h-32 rounded-xl overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editing.imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Features */}
              <div>
                <label className="label">Features (comma-separated)</label>
                <textarea
                  value={featuresInput}
                  onChange={e => setFeaturesInput(e.target.value)}
                  rows={2}
                  className="input-field resize-none"
                  placeholder="Air conditioning, GPS navigation, Card payments, Fully licensed"
                />
                <p className="text-xs text-brand-grey mt-1">
                  Separate each feature with a comma — up to 6 shown on the website
                </p>
              </div>

              {/* Available */}
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-brand-grey-pale rounded-xl">
                <input
                  type="checkbox"
                  checked={editing.available}
                  onChange={e => setField('available', e.target.checked)}
                  className="w-4 h-4 accent-brand-gold"
                />
                <div>
                  <p className="text-sm text-brand-black font-medium">Visible on website</p>
                  <p className="text-xs text-brand-grey">Uncheck to hide this vehicle without deleting it</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-3xl">
              <button
                onClick={saveEdit}
                disabled={!editing.name || !editing.description}
                className="btn-gold flex items-center gap-2 flex-1 justify-center py-3 disabled:opacity-50"
              >
                <Save size={15} />
                {isNew ? 'Add to website' : 'Save changes'}
              </button>
              <button
                onClick={() => { setEditing(null); setIsNew(false); }}
                className="btn-outline-gold flex-1 py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
