'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { customerApi } from '@/lib/api-client';

const GOLD = '#c9a84c';
const BRAND_BLACK = '#0a0f1e';

interface Profile { fullName: string; email: string; phone: string | null; authProvider: string; }

export default function AccountProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    customerApi.get<{ success: boolean; data: Profile }>('/api/customer/profile')
      .then(result => {
        setProfile(result.data);
        setFullName(result.data.fullName);
        setPhone(result.data.phone || '');
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load your profile'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await customerApi.put('/api/customer/profile', { fullName, phone });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading profile...</div>;

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold" style={{ color: BRAND_BLACK }}>Profile</h1>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
      {saved && <div className="px-4 py-3 rounded-xl text-sm text-green-700 bg-green-50 border border-green-100">Profile updated.</div>}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Full Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Email</label>
          <input value={profile?.email ?? ''} disabled className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 bg-slate-50 text-slate-400" />
          <p className="text-xs text-slate-400 mt-1">Email can&apos;t be changed{profile?.authProvider === 'google' ? ' - signed in with Google' : ''}.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">Phone Number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 900 000" className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200" />
          <p className="text-xs text-slate-400 mt-1">Needed before booking through the app.</p>
        </div>
        <button disabled={saving} onClick={save} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:opacity-50" style={{ background: GOLD, color: BRAND_BLACK }}>
          <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
