'use client';

import { useState, useEffect } from 'react';
import { Save, Globe, Palette, Phone, Key, Bell } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface SiteSettings {
  id?: string;
  siteName: string;
  tagline: string;
  heroSubtitle: string;
  logoUrl: string;
  faviconUrl: string;
  brandColor: string;
  accentColor: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  socialLinks: { twitter?: string; instagram?: string; linkedin?: string; facebook?: string };
  seoDefaults: { title: string; description: string; ogImage?: string };
  emailNotifications: boolean;
  smsNotifications: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'Ride Prestige',
  tagline: 'Premium Transport Services',
  heroSubtitle: 'Luxury transport, delivered with precision.',
  logoUrl: '/brand/ride-prestige-mark.png',
  faviconUrl: '/favicon.ico',
  brandColor: '#c9a84c',
  accentColor: '#0a0f1e',
  contactEmail: 'info@rideprestige.co.uk',
  phoneNumber: '+44 7700 900000',
  address: 'United Kingdom',
  socialLinks: {},
  seoDefaults: { title: 'Ride Prestige | Premium Transport', description: 'Luxury transport services.' },
  emailNotifications: true,
  smsNotifications: false,
};

export default function AdminSettingsPage() {
  const [site, setSite] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    adminApi.get<{ success: boolean; data: SiteSettings }>('/api/admin/settings')
      .then(r => { if (r.data) setSite(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await adminApi.put('/api/admin/settings', site).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'integrations', label: 'Integrations', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading settings…</div>;

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
                <label className="label">Hero subtitle</label>
                <input value={site.heroSubtitle} onChange={e => setSite(p => ({ ...p, heroSubtitle: e.target.value }))} className="input-field" />
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
                <input value={site.logoUrl} onChange={e => setSite(p => ({ ...p, logoUrl: e.target.value }))} className="input-field" placeholder="/brand/ride-prestige-mark.png" />
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
              <div>
                <label className="label">Facebook</label>
                <input value={site.socialLinks.facebook || ''} onChange={e => setSite(p => ({ ...p, socialLinks: { ...p.socialLinks, facebook: e.target.value } }))} className="input-field" placeholder="https://facebook.com/..." />
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
                { label: 'Google Maps API key', env: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', desc: 'Required for pickup/drop-off autocomplete and distance calculation' },
                { label: 'Stripe public key', env: 'NEXT_PUBLIC_STRIPE_KEY', desc: 'Required for online payment processing' },
              ].map(({ label, env, desc }) => (
                <div key={env} className="p-5 border border-gray-200 rounded-2xl">
                  <label className="label">{label}</label>
                  <input type="password" placeholder={`Set in environment variables`} disabled className="input-field mb-2 opacity-50" />
                  <p className="text-xs text-brand-grey">{desc}</p>
                  <p className="text-xs text-brand-gold mt-1 font-mono">Env var: {env}</p>
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <p className="text-amber-800 text-sm font-medium mb-1">Security note</p>
                <p className="text-amber-700 text-xs">
                  API keys must be set as environment variables in your deployment platform (Vercel, Railway, etc.), not stored in the database.
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
                { key: 'emailNotifications' as const, label: 'Email notifications', desc: 'Send confirmation emails for new bookings and status changes' },
                { key: 'smsNotifications' as const, label: 'SMS notifications', desc: 'Send SMS alerts to customers for booking updates (requires SMS provider)' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-5 border border-gray-200 rounded-2xl">
                  <div>
                    <p className="font-medium text-sm text-brand-black">{label}</p>
                    <p className="text-xs text-brand-grey">{desc}</p>
                  </div>
                  <button
                    onClick={() => setSite(p => ({ ...p, [key]: !p[key] }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${site[key] ? 'bg-brand-gold' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${site[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm text-brand-grey">Changes are saved to the database and applied immediately.</p>
        <button onClick={save} disabled={saving} className="btn-gold flex items-center gap-2 py-2.5 px-6 disabled:opacity-60">
          <Save size={15} />
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
