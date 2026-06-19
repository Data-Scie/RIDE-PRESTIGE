'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Star, X } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  rating: number;
  totalJobs: number;
  driverType: 'affiliateDriver' | 'independentDriver';
  applicationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  documentsStatus?: 'missing' | 'pending' | 'approved' | 'rejected' | 'expired';
  affiliate?: { id: string; companyName: string } | null;
}

interface Affiliate { id: string; companyName: string; }

const STATUS_DOT: Record<string, string> = { available: '#10b981', busy: '#3b82f6', offline: '#94a3b8' };
type DriverSection = 'pending' | 'approved' | 'rejected' | 'suspended' | 'independentDriver' | 'affiliateDriver' | 'all';

const SECTIONS: { key: DriverSection; label: string }[] = [
  { key: 'pending', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'independentDriver', label: 'Independent' },
  { key: 'affiliateDriver', label: 'Affiliate Drivers' },
  { key: 'all', label: 'All' },
];

const emptyForm = {
  fullName: '', email: '', phone: '', password: '',
  address: '', city: '', postcode: '', dateOfBirth: '',
  drivingLicenceNumber: '', privateHireBadgeNumber: '', nationalInsurance: '',
  driverType: 'independentDriver' as 'independentDriver' | 'affiliateDriver',
  affiliateId: '', preApprove: true,
};

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [search, setSearch] = useState('');
  const [section, setSection] = useState<DriverSection>('pending');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = async () => {
    const [driversResult, affiliatesResult] = await Promise.all([
      adminApi.get<{ success: boolean; data: Driver[] }>('/api/admin/drivers'),
      adminApi.get<{ success: boolean; data: Affiliate[] }>('/api/admin/affiliates'),
    ]);
    setDrivers(driversResult.data);
    setAffiliates(affiliatesResult.data);
  };

  useEffect(() => {
    load().catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const updateApplication = async (driver: Driver, action: 'approve' | 'reject' | 'suspend') => {
    setUpdating(driver.id);
    setError('');
    try {
      if (action === 'approve') await adminApi.put(`/api/admin/drivers/${driver.id}/approve`, { approve: true });
      else await adminApi.put(`/api/admin/drivers/${driver.id}/${action}`, {});
      await load();
    } catch (e) {
      setError((e as Error).message || `Could not ${action} driver`);
    } finally {
      setUpdating(null);
    }
  };

  const createDriver = async () => {
    setCreating(true);
    setCreateError('');
    try {
      await adminApi.post('/api/admin/drivers', form);
      setShowCreate(false);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setCreateError((e as Error).message || 'Could not create driver');
    } finally {
      setCreating(false);
    }
  };

  const visible = drivers.filter(driver => {
    const term = search.toLowerCase();
    const matchesSearch = !term || [driver.fullName, driver.email, driver.affiliate?.companyName]
      .some(value => value?.toLowerCase().includes(term));
    const matchesFilter = section === 'all' || driver.applicationStatus === section || driver.driverType === section;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading drivers...</div>;

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>Drivers</h1>
          <p className="text-slate-500 text-sm">
            {drivers.filter(driver => driver.applicationStatus === 'pending').length} pending · {drivers.length} total
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#0a0f1e' }}>
          <Plus size={15} /> Add driver
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3" style={{ border: '1px solid #f0f0f0' }}>
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search driver or affiliate" className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none" />
        </div>
        {SECTIONS.map(({ key, label }) => (
          <button key={key} onClick={() => setSection(key)} className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: section === key ? '#c9a84c' : '#f8fafc', color: section === key ? 'white' : '#64748b' }}>{label} <span className="opacity-70">({drivers.filter(driver => key === 'all' || driver.applicationStatus === key || driver.driverType === key).length})</span></button>
        ))}
      </div>

      <div className="bg-white rounded-2xl overflow-x-auto" style={{ border: '1px solid #f0f0f0' }}>
        <table className="w-full">
          <thead><tr className="bg-slate-50">
            {['Driver', 'Type / Affiliate', 'Contact', 'Application', 'Documents', 'Work Status', 'Rating', 'Rides', 'Actions'].map(header => <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{header}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map(driver => (
              <tr key={driver.id}>
                <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold">{driver.fullName.charAt(0)}</div><span className="font-semibold text-sm">{driver.fullName}</span></div></td>
                <td className="px-4 py-4"><p className="text-xs font-semibold">{driver.driverType === 'affiliateDriver' ? 'Affiliate Driver' : 'Independent Driver'}</p><p className="text-xs text-slate-400">{driver.affiliate?.companyName ?? 'Direct Ride Prestige driver'}</p></td>
                <td className="px-4 py-4"><p className="text-sm">{driver.email}</p><p className="text-xs text-slate-400">{driver.phone}</p></td>
                <td className="px-4 py-4"><span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${driver.applicationStatus === 'approved' ? 'bg-green-50 text-green-700' : driver.applicationStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{driver.applicationStatus}</span></td>
                <td className="px-4 py-4"><span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${driver.documentsStatus === 'approved' ? 'bg-green-50 text-green-700' : driver.documentsStatus === 'rejected' || driver.documentsStatus === 'expired' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{driver.documentsStatus ?? 'missing'}</span></td>
                <td className="px-4 py-4"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[driver.status] ?? '#94a3b8' }} /><span className="text-xs capitalize">{driver.status}</span></div></td>
                <td className="px-4 py-4"><span className="flex items-center gap-1 text-sm"><Star size={12} className="text-amber-400" />{driver.rating || '-'}</span></td>
                <td className="px-4 py-4 text-sm">{driver.totalJobs}</td>
                <td className="px-4 py-4"><div className="flex gap-2 items-center">
                  {driver.applicationStatus !== 'approved' && <button disabled={updating === driver.id} onClick={() => updateApplication(driver, 'approve')} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 disabled:opacity-50">Approve</button>}
                  {driver.applicationStatus === 'pending' && <button disabled={updating === driver.id} onClick={() => updateApplication(driver, 'reject')} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 disabled:opacity-50">Reject</button>}
                  {driver.applicationStatus === 'approved' && <button disabled={updating === driver.id} onClick={() => updateApplication(driver, 'suspend')} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 disabled:opacity-50">Suspend</button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <div className="py-16 text-center text-slate-400">No drivers match this filter.</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,15,30,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>Add driver</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            {createError && <div className="px-3 py-2.5 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{createError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field col-span-2" placeholder="Full name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              <input className="input-field" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className="input-field" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="input-field col-span-2" placeholder="Temporary password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <input className="input-field" placeholder="Driving licence number" value={form.drivingLicenceNumber} onChange={e => setForm({ ...form, drivingLicenceNumber: e.target.value })} />
              <input className="input-field" placeholder="PHV badge number" value={form.privateHireBadgeNumber} onChange={e => setForm({ ...form, privateHireBadgeNumber: e.target.value })} />
              <input className="input-field" placeholder="Postcode" value={form.postcode} onChange={e => setForm({ ...form, postcode: e.target.value })} />
              <input className="input-field" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              <select className="input-field col-span-2" value={form.driverType} onChange={e => setForm({ ...form, driverType: e.target.value as typeof form.driverType, affiliateId: '' })}>
                <option value="independentDriver">Independent driver</option>
                <option value="affiliateDriver">Affiliate driver</option>
              </select>
              {form.driverType === 'affiliateDriver' && (
                <select className="input-field col-span-2" value={form.affiliateId} onChange={e => setForm({ ...form, affiliateId: e.target.value })}>
                  <option value="">Select affiliate…</option>
                  {affiliates.map(a => <option key={a.id} value={a.id}>{a.companyName}</option>)}
                </select>
              )}
              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.preApprove} onChange={e => setForm({ ...form, preApprove: e.target.checked })} />
                Pre-approve this driver (skip document review, allow going online immediately)
              </label>
            </div>
            <button onClick={createDriver} disabled={creating} className="btn-gold w-full py-2.5 text-sm disabled:opacity-50">
              {creating ? 'Creating…' : 'Create driver'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
