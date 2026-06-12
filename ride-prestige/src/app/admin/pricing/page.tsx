'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, Car, Bus, Van, Truck } from 'lucide-react';
import { pricingConfig, cancellationPolicy } from '@/lib/data';
import type { PricingConfig, CancellationPolicy } from '@/types';

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<PricingConfig>(pricingConfig);
  const [cancel, setCancel] = useState<CancellationPolicy>(cancellationPolicy);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/data/pricing').then(r => r.json()).then(({ data }) => { if (data) setPricing(data); }).catch(() => {});
    fetch('/api/admin/data/cancellation').then(r => r.json()).then(({ data }) => { if (data) setCancel(data); }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    await Promise.all([
      fetch('/api/admin/data/pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pricing) }),
      fetch('/api/admin/data/cancellation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cancel) }),
    ]).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Live sample calculation
  const sample = {
    miles: 20,
    hours: 1.5,
    prestige: pricing.prestige.ratePerMile * 20 + pricing.prestige.hourlyRate * 1.5,
    minibus: pricing.minibus.ratePerMile * 20 + pricing.minibus.rate16Seater * 0.5,
    coach: pricing.coaches.ratePerMile * 20 + pricing.coaches.hourlyRate * 1.5,
    taxi: Math.max(pricing.taxi.ratePerMile * 20, pricing.taxi.minimumFare),
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-black mb-1">Pricing Manager</h1>
        <p className="text-sm text-brand-grey">Edit fare formulas for each vehicle category. Changes save to local storage and will apply when connected to a database.</p>
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
            <label className="label">Distance tariff</label>
            <input type="number" step="0.10" min="0" value={pricing.prestige.ratePerMile}
              onChange={e => setPricing(p => ({ ...p, prestige: { ...p.prestige, ratePerMile: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
            <p className="text-xs text-brand-grey mt-1">Current distance tariff: £{pricing.prestige.ratePerMile.toFixed(2)}</p>
          </div>
          <div>
            <label className="label">Time tariff</label>
            <input type="number" step="1" min="0" value={pricing.prestige.hourlyRate}
              onChange={e => setPricing(p => ({ ...p, prestige: { ...p.prestige, hourlyRate: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
            <p className="text-xs text-brand-grey mt-1">Current time tariff: £{pricing.prestige.hourlyRate}</p>
          </div>
        </div>
      </div>

      {/* Minibus */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7">
        <div className="flex items-center gap-3 mb-5">
          <Van size={22} className="text-brand-gold" />
          <div>
            <h2 className="font-semibold text-brand-black" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Minibuses</h2>
            <p className="text-xs text-brand-grey">Costs combine distance and a fixed daily vehicle charge. Final price confirmed on booking.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="label">Distance tariff</label>
            <input type="number" step="0.10" min="0" value={pricing.minibus.ratePerMile}
              onChange={e => setPricing(p => ({ ...p, minibus: { ...p.minibus, ratePerMile: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">16-seater day charge</label>
            <input type="number" step="10" min="0" value={pricing.minibus.rate16Seater}
              onChange={e => setPricing(p => ({ ...p, minibus: { ...p.minibus, rate16Seater: parseFloat(e.target.value) || 0 } } ))}
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
            <p className="text-xs text-brand-grey">Costs combine distance and duration. Final price confirmed on booking.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Distance tariff</label>
            <input type="number" step="0.10" min="0" value={pricing.coaches.ratePerMile}
              onChange={e => setPricing(p => ({ ...p, coaches: { ...p.coaches, ratePerMile: parseFloat(e.target.value) || 0 } }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">Time tariff</label>
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
            <label className="label">Distance tariff</label>
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

      {/* Driver search radius */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7">
        <h2 className="font-semibold text-brand-black mb-4" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Driver Search Radius</h2>
        <div className="max-w-xs">
          <label className="label">Search radius (miles)</label>
          <input type="number" step="1" min="1" max="100" value={pricing.driverSearchRadiusMiles}
            onChange={e => setPricing(p => ({ ...p, driverSearchRadiusMiles: parseInt(e.target.value) || 20 }))}
            className="input-field" />
          <p className="text-xs text-brand-grey mt-1">Drivers within {pricing.driverSearchRadiusMiles} miles of pickup will be notified</p>
        </div>
      </div>

      {/* Cancellation policy */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7">
        <h2 className="font-semibold text-brand-black mb-4" style={{ fontFamily:'Playfair Display,Georgia,serif' }}>Cancellation Policy</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Min. hours before ride for cancellation</label>
            <input type="number" step="1" min="0" value={cancel.minHoursBeforeRide}
              onChange={e => setCancel(p => ({ ...p, minHoursBeforeRide: parseInt(e.target.value) || 8 }))}
              className="input-field" />
            <p className="text-xs text-brand-grey mt-1">Currently {cancel.minHoursBeforeRide} hours</p>
          </div>
          <div>
            <label className="label">Refund processing window (hours)</label>
            <input type="number" step="1" min="0" value={cancel.refundWindowHours}
              onChange={e => setCancel(p => ({ ...p, refundWindowHours: parseInt(e.target.value) || 48 }))}
              className="input-field" />
            <p className="text-xs text-brand-grey mt-1">Currently {cancel.refundWindowHours} hours</p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Policy message (shown to customers)</label>
            <textarea value={cancel.message} rows={3}
              onChange={e => setCancel(p => ({ ...p, message: e.target.value }))}
              className="input-field resize-none" />
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
