'use client';

import { useState, useEffect } from 'react';
import { Save, Globe, Palette, Phone, DollarSign, Key, Bell } from 'lucide-react';
import { siteSettings, fareSettings as defaultFare } from '@/lib/data';
import type { FareSettings } from '@/types';

export default function AdminSettingsPage() {
  const [site, setSite] = useState(siteSettings);
  const [fare, setFare] = useState<FareSettings>(defaultFare);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetch('/api/admin/data/settings').then(r => r.json()).then(({ data }) => {
      if (data?.site) setSite(data.site);
      if (data?.fare) setFare(data.fare);
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/data/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site, fare }) }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'fare', label: 'Fare & Pricing', icon: DollarSign },
    { id: 'integrations', label: 'Integrations', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 flex flex-wrap gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === id ? 'bg-brand-black text-white shadow-sm' : 'text-brand-grey hover:text-brand-black hover:bg-gray-50'
            }`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        {/* General */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-semibold text-brand-black">General settings</h3>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Site name</label>
                <input value={site.siteName} onChange={e => setSite(p => ({ ...p, siteName: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Tagline</label>
                <input value={site.tagline} onChange={e => setSite(p => ({ ...p, tagline: e.target.value }))} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">SEO default title</label>
                <input value={site.seoDefaults.title} onChange={e => setSite(p => ({ ...p, seoDefaults: { ...p.seoDefaults, title: e.target.value } }))} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">SEO default description</label>
                <textarea value={site.seoDefaults.description} onChange={e => setSite(p => ({ ...p, seoDefaults: { ...p.seoDefaults, description: e.target.value } }))} rows={3} className="input-field resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Branding */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-semibold text-brand-black">Branding</h3>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Logo URL</label>
                <input value={site.logoUrl} onChange={e => setSite(p => ({ ...p, logoUrl: e.target.value }))} className="input-field" placeholder="/logo.svg" />
                <p className="text-xs text-brand-grey mt-1">Place logo file in /public/ and reference the path here</p>
              </div>
              <div>
                <label className="label">Favicon URL</label>
                <input value={site.faviconUrl} onChange={e => setSite(p => ({ ...p, faviconUrl: e.target.value }))} className="input-field" placeholder="/favicon.ico" />
              </div>
              <div>
                <label className="label">Brand colour (hex)</label>
                <div className="flex gap-2">
                  <input type="color" value={site.brandColor} onChange={e => setSite(p => ({ ...p, brandColor: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input value={site.brandColor} onChange={e => setSite(p => ({ ...p, brandColor: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Accent colour (hex)</label>
                <div className="flex gap-2">
                  <input type="color" value={site.accentColor} onChange={e => setSite(p => ({ ...p, accentColor: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input value={site.accentColor} onChange={e => setSite(p => ({ ...p, accentColor: e.target.value }))} className="input-field" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-semibold text-brand-black">Contact information</h3>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Phone number</label>
                <input value={site.phoneNumber} onChange={e => setSite(p => ({ ...p, phoneNumber: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Contact email</label>
                <input value={site.contactEmail} onChange={e => setSite(p => ({ ...p, contactEmail: e.target.value }))} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <input value={site.address} onChange={e => setSite(p => ({ ...p, address: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Twitter / X</label>
                <input value={site.socialLinks.twitter || ''} onChange={e => setSite(p => ({ ...p, socialLinks: { ...p.socialLinks, twitter: e.target.value } }))} className="input-field" placeholder="https://twitter.com/..." />
              </div>
              <div>
                <label className="label">Instagram</label>
                <input value={site.socialLinks.instagram || ''} onChange={e => setSite(p => ({ ...p, socialLinks: { ...p.socialLinks, instagram: e.target.value } }))} className="input-field" placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label className="label">LinkedIn</label>
                <input value={site.socialLinks.linkedin || ''} onChange={e => setSite(p => ({ ...p, socialLinks: { ...p.socialLinks, linkedin: e.target.value } }))} className="input-field" placeholder="https://linkedin.com/..." />
              </div>
            </div>
          </div>
        )}

        {/* Fare */}
        {activeTab === 'fare' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-xl font-semibold text-brand-black mb-1">Fare & pricing settings</h3>
              <p className="text-sm text-brand-grey">These values control how journey pricing is estimated. Actual booking totals are confirmed at checkout.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { key: 'baseFare', label: 'Base fare', desc: 'Applied to every booking' },
                { key: 'ratePerMile', label: 'Distance tariff', desc: 'Applied to distance-based journeys' },
                { key: 'ratePerMinute', label: 'Time tariff', desc: 'Applied to duration-based journeys' },
                { key: 'surgeMultiplier', label: 'Demand multiplier', desc: '1.0 = standard pricing' },
                { key: 'serviceFee', label: 'Service fee', desc: 'Platform booking surcharge' },
                { key: 'mcPercentage', label: 'Management fee (%)', desc: 'Applied as a percentage of the booking total' },
                { key: 'waitingTimeFee', label: 'Waiting time fee', desc: 'Applied after the complimentary waiting period' },
                { key: 'airportFee', label: 'Airport pickup fee', desc: 'Flat charge for airport pickup or drop-off' },
                { key: 'minimumFare', label: 'Minimum charge', desc: 'Lowest possible charge for any journey' },
              ].map(({ key, label, desc }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type="number" step="0.01" min="0"
                    value={fare[key as keyof FareSettings]}
                    onChange={e => setFare(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                    className="input-field" />
                  <p className="text-xs text-brand-grey mt-1">{desc}</p>
                </div>
              ))}
            </div>

            {/* Live preview */}
            <div className="bg-brand-grey-pale rounded-2xl p-6">
              <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-3">Sample fare preview (20 miles, 40 min)</p>
              <div className="space-y-2 text-sm">
                {[
                  ['Base fare', fare.baseFare],
                  ['Distance (20mi)', fare.ratePerMile * 20],
                  ['Duration (40min)', fare.ratePerMinute * 40],
                  ['Service fee', fare.serviceFee],
                  ['MC %', ((fare.baseFare + fare.ratePerMile * 20 + fare.ratePerMinute * 40 + fare.serviceFee) * fare.mcPercentage / 100)],
                ].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between">
                    <span className="text-brand-grey text-xs">{l as string}</span>
                    <span className="text-brand-black text-xs font-medium">£{(v as number).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-brand-black">Estimated total</span>
                  <span className="font-bold text-brand-black">
                    £{Math.max(fare.minimumFare, fare.baseFare + fare.ratePerMile * 20 + fare.ratePerMinute * 40 + fare.serviceFee + ((fare.baseFare + fare.ratePerMile * 20 + fare.ratePerMinute * 40 + fare.serviceFee) * fare.mcPercentage / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrations */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-semibold text-brand-black">API integrations</h3>
            <div className="space-y-5">
              {[
                { label: 'Google Maps API key', key: 'googleMapsApiKey', env: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', desc: 'Required for pickup/drop-off autocomplete and distance calculation' },
                { label: 'Stripe public key', key: 'stripePublicKey', env: 'NEXT_PUBLIC_STRIPE_KEY', desc: 'Required for online payment processing' },
              ].map(({ label, key, env, desc }) => (
                <div key={key} className="p-5 border border-gray-200 rounded-2xl">
                  <label className="label">{label}</label>
                  <input
                    type="password" placeholder={`Enter ${label.toLowerCase()}...`}
                    value={(site as unknown as Record<string, unknown>)[key] as string || ''}
                    onChange={e => setSite(p => ({ ...p, [key]: e.target.value }))}
                    className="input-field mb-2"
                  />
                  <p className="text-xs text-brand-grey">{desc}</p>
                  <p className="text-xs text-brand-gold mt-1 font-mono">Env var: {env}</p>
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <p className="text-amber-800 text-sm font-medium mb-1">⚠️ Security note</p>
                <p className="text-amber-700 text-xs">
                  In production, store API keys as server-side environment variables in your deployment platform (Vercel, Railway, etc.), never in the client-side settings panel.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-semibold text-brand-black">Notification settings</h3>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email notifications', desc: 'Send confirmation emails for new bookings and status changes' },
                { key: 'smsNotifications', label: 'SMS notifications', desc: 'Send SMS alerts to customers for booking updates (requires SMS provider)' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-5 border border-gray-200 rounded-2xl">
                  <div>
                    <p className="font-medium text-sm text-brand-black">{label}</p>
                    <p className="text-xs text-brand-grey">{desc}</p>
                  </div>
                  <button
                    onClick={() => setSite(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${(site as unknown as Record<string, unknown>)[key] ? 'bg-brand-gold' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${(site as unknown as Record<string, unknown>)[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm text-brand-grey">Changes are saved to local storage until connected to a database.</p>
        <button onClick={save} className="btn-gold flex items-center gap-2 py-2.5 px-6">
          <Save size={15} />
          {saved ? 'Saved!' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
