'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { siteSettings } from '@/lib/data';

export default function AdminContactSettingsPage() {
  const [settings, setSettings] = useState({
    contactEmail: siteSettings.contactEmail,
    phoneNumber: siteSettings.phoneNumber,
    address: siteSettings.address,
    twitter: siteSettings.socialLinks.twitter || '',
    instagram: siteSettings.socialLinks.instagram || '',
    linkedin: siteSettings.socialLinks.linkedin || '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/data/contact').then(r => r.json()).then(({ data }) => {
      if (data) setSettings({ contactEmail: data.contactEmail, phoneNumber: data.phoneNumber, address: data.address, twitter: data.socialLinks?.twitter || '', instagram: data.socialLinks?.instagram || '', linkedin: data.socialLinks?.linkedin || '' });
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    const payload = { phoneNumber: settings.phoneNumber, contactEmail: settings.contactEmail, address: settings.address, socialLinks: { twitter: settings.twitter, instagram: settings.instagram, linkedin: settings.linkedin } };
    await fetch('/api/admin/data/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

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
            <input value={settings.phoneNumber} onChange={e => setSettings(p => ({ ...p, phoneNumber: e.target.value }))} className="input-field" placeholder="+44 114 000 0000" />
          </div>
          <div>
            <label className="label">Email address</label>
            <input value={settings.contactEmail} onChange={e => setSettings(p => ({ ...p, contactEmail: e.target.value }))} className="input-field" placeholder="bookings@rideprestige.co.uk" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Business address</label>
            <input value={settings.address} onChange={e => setSettings(p => ({ ...p, address: e.target.value }))} className="input-field" placeholder="Acquire London College, Sheffield, S1 1AB" />
            <p className="text-xs text-brand-grey mt-1">Displayed on the Contact page and Footer</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-7 space-y-5">
        <h2 className="font-display text-lg font-semibold text-brand-black">Social Links</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Twitter / X</label>
            <input value={settings.twitter} onChange={e => setSettings(p => ({ ...p, twitter: e.target.value }))} className="input-field" placeholder="https://twitter.com/..." />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input value={settings.instagram} onChange={e => setSettings(p => ({ ...p, instagram: e.target.value }))} className="input-field" placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className="label">LinkedIn</label>
            <input value={settings.linkedin} onChange={e => setSettings(p => ({ ...p, linkedin: e.target.value }))} className="input-field" placeholder="https://linkedin.com/company/..." />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm text-brand-grey">Changes are published live to the website.</p>
        <button type="button" onClick={save} disabled={saving} className="btn-gold flex items-center gap-2 py-2.5 px-6 disabled:opacity-60">
          {saved ? <><CheckCircle size={15} /> Saved!</> : saving ? <><span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" /> Saving…</> : <><Save size={15} /> Save Contact Info</>}
        </button>
      </div>
    </div>
  );
}
