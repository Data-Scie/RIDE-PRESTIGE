'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, Car, Bus, Van, Truck } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface PricingData {
  prestige: { ratePerMile: number; hourlyRate: number };
  minibus: { ratePerMile: number; rate16Seater: number; rate24Seater: number; rate32Seater: number };
  coaches: { ratePerMile: number; hourlyRate: number };
  taxi: { ratePerMile: number; minimumFare: number };
  driverSearchRadiusMiles: number;
  commissionPercentage: number;
  driverPayoutPercentage: number;
}

const DEFAULT_PRICING: PricingData = {
  prestige: { ratePerMile: 4.40, hourlyRate: 70 },
  minibus:  { ratePerMile: 4.00, rate16Seater: 420, rate24Seater: 520, rate32Seater: 620 },
  coaches:  { ratePerMile: 4.00, hourlyRate: 110 },
  taxi:     { ratePerMile: 3.00, minimumFare: 8 },
  driverSearchRadiusMiles: 20,
  commissionPercentage: 27.5,
  driverPayoutPercentage: 60,
};

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<PricingData>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.get<{ success: boolean; data: PricingData }>('/api/admin/pricing')
      .then(r => { if (r.data) setPricing(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await adminApi.put('/api/admin/pricing', pricing).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Live sample calculation
  const sample = {
    prestige: pricing.prestige.ratePerMile * 20 + pricing.prestige.hourlyRate * 1.5,
    minibus: pricing.minibus.ratePerMile * 20 + pricing.minibus.rate16Seater * 0.5,
    coach: pricing.coaches.ratePerMile * 20 + pricing.coaches.hourlyRate * 1.5,
    taxi: Math.max(pricing.taxi.ratePerMile * 20, pricing.taxi.minimumFare),
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading pricing…</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-black mb-1">Pricing Manager</h1>
        <p className="text-sm text-brand-grey">Edit fare formulas for each vehicle category. Changes are saved to the database.</p>
      </div>

      {/* Prestige */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7">
        <div className="flex items-center gap-3 mb-5">
          <Car size={22} className="text-brand-gold" />
          <div>
            <h2 className="font-semibold text-brand-black" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Prestige Vehicles</h2>
            <p className="text-xs text-brand-grey">Price is based on distance and duration, with the final amount confirmed at booking.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Distance tariff (£/mile)</label>
            <input type="number" step="0.10" min="0" value={pricing.prestige.ratePerMile}
              onChange={e => setPricing(p => ({ ...p, prestige: { ...p.prestige, ratePerMile: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">Time tariff (£/hour)</label>
            <input type="number" step="1" min="0" value={pricing.prestige.hourlyRate}
              onChange={e => setPricing(p => ({ ...p, prestige: { ...p.prestige, hourlyRate: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
        </div>
      </div>

      {/* Minibus */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7">
        <div className="flex items-center gap-3 mb-5">
          <Van size={22} className="text-brand-gold" />
          <div>
            <h2 className="font-semibold text-brand-black" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Minibuses</h2>
            <p className="text-xs text-brand-grey">Costs combine distance and a fixed daily vehicle charge.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="label">Distance tariff (£/mile)</label>
            <input type="number" step="0.10" min="0" value={pricing.minibus.ratePerMile}
              onChange={e => setPricing(p => ({ ...p, minibus: { ...p.minibus, ratePerMile: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">16-seater day charge</label>
            <input type="number" step="10" min="0" value={pricing.minibus.rate16Seater}
              onChange={e => setPricing(p => ({ ...p, minibus: { ...p.minibus, rate16Seater: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">24-seater day charge</label>
            <input type="number" step="10" min="0" value={pricing.minibus.rate24Seater}
              onChange={e => setPricing(p => ({ ...p, minibus: { ...p.minibus, rate24Seater: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">32-seater day charge</label>
            <input type="number" step="10" min="0" value={pricing.minibus.rate32Seater}
              onChange={e => setPricing(p => ({ ...p, minibus: { ...p.minibus, rate32Seater: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
        </div>
      </div>

      {/* Coaches */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7">
        <div className="flex items-center gap-3 mb-5">
          <Bus size={22} className="text-brand-gold" />
          <div>
            <h2 className="font-semibold text-brand-black" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Coaches</h2>
            <p className="text-xs text-brand-grey">Costs combine distance and duration.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Distance tariff (£/mile)</label>
            <input type="number" step="0.10" min="0" value={pricing.coaches.ratePerMile}
              onChange={e => setPricing(p => ({ ...p, coaches: { ...p.coaches, ratePerMile: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">Time tariff (£/hour)</label>
            <input type="number" step="5" min="0" value={pricing.coaches.hourlyRate}
              onChange={e => setPricing(p => ({ ...p, coaches: { ...p.coaches, hourlyRate: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
        </div>
      </div>

      {/* Taxi */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7">
        <div className="flex items-center gap-3 mb-5">
          <Truck size={22} className="text-brand-gold" />
          <div>
            <h2 className="font-semibold text-brand-black" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Taxis</h2>
            <p className="text-xs text-brand-grey">Distance-based pricing with a minimum booking charge.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Distance tariff (£/mile)</label>
            <input type="number" step="0.10" min="0" value={pricing.taxi.ratePerMile}
              onChange={e => setPricing(p => ({ ...p, taxi: { ...p.taxi, ratePerMile: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">Minimum charge</label>
            <input type="number" step="0.50" min="0" value={pricing.taxi.minimumFare}
              onChange={e => setPricing(p => ({ ...p, taxi: { ...p.taxi, minimumFare: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
        </div>
      </div>

      {/* Operations */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7">
        <h2 className="font-semibold text-brand-black mb-5" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Operations</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="label">Driver search radius (miles)</label>
            <input type="number" step="1" min="1" max="100" value={pricing.driverSearchRadiusMiles}
              onChange={e => setPricing(p => ({ ...p, driverSearchRadiusMiles: parseInt(e.target.value) || 20 }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">Commission (%)</label>
            <input type="number" step="0.5" min="0" max="100" value={pricing.commissionPercentage}
              onChange={e => setPricing(p => ({ ...p, commissionPercentage: parseFloat(e.target.value) || 0 }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">Driver payout (%)</label>
            <input type="number" step="0.5" min="0" max="100" value={pricing.driverPayoutPercentage}
              onChange={e => setPricing(p => ({ ...p, driverPayoutPercentage: parseFloat(e.target.value) || 0 }))}
              className="input-field" />
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7">
        <h2 className="font-semibold text-brand-black mb-4" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Live Fare Preview</h2>
        <p className="text-xs text-brand-grey mb-5">Sample calculation: 20 miles, 1.5 hours journey</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { cat:'Prestige', icon:<Car size={24} className="mx-auto" />, fare: sample.prestige },
            { cat:'Minibus (16-seat)', icon:<Van size={24} className="mx-auto" />, fare: sample.minibus },
            { cat:'Coach', icon:<Bus size={24} className="mx-auto" />, fare: sample.coach },
            { cat:'Taxi', icon:<Truck size={24} className="mx-auto" />, fare: sample.taxi },
          ].map(({ cat, icon, fare }) => (
            <div key={cat} className="rounded-xl p-4 text-center" style={{ background:'#f8f9fb', border:'1px solid #e8eaf0' }}>
              <div className="mb-3">{icon}</div>
              <p className="text-xs text-brand-grey mt-2 mb-1">{cat}</p>
              <p className="font-bold text-lg" style={{ fontFamily:'Playfair Display,Georgia,serif', color:'#0a0f1e' }}>
                £{Math.max(fare, 0).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm text-brand-grey">Changes are published live to the website.</p>
        <button type="button" onClick={save} disabled={saving} className="btn-gold flex items-center gap-2 py-2.5 px-6 disabled:opacity-60">
          {saved ? <><CheckCircle size={15} /> Saved!</> : saving ? <><span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" /> Saving…</> : <><Save size={15} /> Save Pricing</>}
        </button>
      </div>
    </div>
  );
}
