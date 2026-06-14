'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface SiteSettings {
  id?: string;
  siteName: string; tagline: string; heroSubtitle: string;
  logoUrl: string; faviconUrl: string; brandColor: string; accentColor: string;
  contactEmail: string; phoneNumber: string; address: string;
  socialLinks: { twitter?: string; instagram?: string; linkedin?: string; facebook?: string };
  seoDefaults: { title: string; description: string; ogImage?: string };
  emailNotifications: boolean; smsNotifications: boolean;
}

const DEFAULT: SiteSettings = {
  siteName: 'Ride Prestige', tagline: '', heroSubtitle: '',
  logoUrl: '', faviconUrl: '', brandColor: '#c9a84c', accentColor: '#0a0f1e',
  contactEmail: '', phoneNumber: '', address: '',
  socialLinks: {}, seoDefaults: { title: '', description: '' },
  emailNotifications: true, smsNotifications: false,
};

export default function AdminContactSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.get<{ success: boolean; data: SiteSettings }>('/api/admin/settings')
      .then(r => { if (r.data) setSettings(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setField = (key: keyof SiteSettings, value: string) =>
    setSettings(p => ({ ...p, [key]: value }));

  const setSocial = (key: string, value: string) =>
    setSettings(p => ({ ...p, socialLinks: { ...p.socialLinks, [key]: value } }));

  const save = async () => {
    setSaving(true);
    await adminApi.put('/api/admin/settings', settings).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="text-brand-grey text-sm p-4">Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-black mb-1">Contact Settings</h1>
        <p className="text-sm text-brand-grey">Update the contact information displayed across the website.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-7 space-y-5">
        <h2 className="font-display text-lg font-semibold text-brand-black">Business Contact</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Phone number</label>
            <input value={settings.phoneNumber} onChange={e => setField('phoneNumber', e.target.value)} className="input-field" placeholder="+44 114 000 0000" />
          </div>
          <div>
            <label className="label">Email address</label>
            <input value={settings.contactEmail} onChange={e => setField('contactEmail', e.target.value)} className="input-field" placeholder="bookings@rideprestige.co.uk" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Business address</label>
            <input value={settings.address} onChange={e => setField('address', e.target.value)} className="input-field" placeholder="Acquire London College, Sheffield, S1 1AB" />
            <p className="text-xs text-brand-grey mt-1">Displayed on the Contact page and Footer</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-7 space-y-5">
        <h2 className="font-display text-lg font-semibold text-brand-black">Social Links</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
            { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
            { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                value={(settings.socialLinks as Record<string, string>)[key] ?? ''}
                onChange={e => setSocial(key, e.target.value)}
                className="input-field"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm text-brand-grey">Changes are published live to the website.</p>
        <button type="button" onClick={save} disabled={saving} className="btn-gold flex items-center gap-2 py-2.5 px-6 disabled:opacity-60">
          {saved
            ? <><CheckCircle size={15} /> Saved!</>
            : saving
              ? <><span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" /> Saving…</>
              : <><Save size={15} /> Save Contact Info</>
          }
        </button>
      </div>
    </div>
  );
}
