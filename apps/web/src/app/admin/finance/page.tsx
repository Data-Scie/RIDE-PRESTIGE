'use client';

import { useEffect, useState } from 'react';
import { Download, TrendingUp, Receipt, Building2, Car, Banknote } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

type Tab = 'revenue' | 'payments' | 'affiliate' | 'driver' | 'company';

const TABS: { key: Tab; label: string; icon: typeof TrendingUp }[] = [
  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  { key: 'payments', label: 'Booking Payments', icon: Receipt },
  { key: 'affiliate', label: 'Affiliate Financials', icon: Building2 },
  { key: 'driver', label: 'Driver Financials', icon: Car },
  { key: 'company', label: 'Company Financials', icon: Banknote },
];

interface RevenueSummary { dailyRevenue: number; weeklyRevenue: number; monthlyRevenue: number; annualRevenue: number; totalRevenue: number; totalRpCommission: number; }
interface CompanySummary { rpCommission: number; grossTurnover: number; totalPayouts: number; operationalRevenue: number; }
interface PaymentRow { id: string; bookingRef: string | null; customerName: string; amount: number; method: string; status: string; paidAt: string | null; createdAt: string; }
interface EarningRow { id: string; bookingRef: string; entityType: string; entityName: string; grossAmount: number; commissionDeducted: number; netAmount: number; status: string; date: string; }

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f0f0' }}>
    <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className="text-2xl font-semibold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>{value}</p>
  </div>
);

function exportUrl(path: string, format: 'csv' | 'pdf', params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, format }).toString();
  return `/api/backend/admin/finance/${path}?${qs}`;
}

function ExportButtons({ path, params }: { path: string; params: Record<string, string> }) {
  return (
    <div className="flex gap-2">
      <a href={exportUrl(path, 'csv', params)} download={`${path}.csv`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
        <Download size={13} /> CSV
      </a>
      <a href={exportUrl(path, 'pdf', params)} download={`${path}.pdf`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
        <Download size={13} /> PDF
      </a>
    </div>
  );
}

export default function AdminFinancePage() {
  const [tab, setTab] = useState<Tab>('revenue');
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [company, setCompany] = useState<CompanySummary | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [affiliateEarnings, setAffiliateEarnings] = useState<EarningRow[]>([]);
  const [driverEarnings, setDriverEarnings] = useState<EarningRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filterParams: Record<string, string> = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  };

  const load = () => {
    setLoading(true);
    const qs = new URLSearchParams(filterParams).toString();
    Promise.all([
      adminApi.get<{ success: boolean; data: RevenueSummary }>('/api/admin/finance/revenue'),
      adminApi.get<{ success: boolean; data: CompanySummary }>('/api/admin/finance/company'),
      adminApi.get<{ success: boolean; data: PaymentRow[] }>(`/api/admin/finance/payments?${qs}`),
      adminApi.get<{ success: boolean; data: EarningRow[] }>(`/api/admin/finance/earnings?entityType=affiliate&${qs}`),
      adminApi.get<{ success: boolean; data: EarningRow[] }>(`/api/admin/finance/earnings?entityType=driver&${qs}`),
    ])
      .then(([r, c, p, ae, de]) => { setRevenue(r.data); setCompany(c.data); setPayments(p.data); setAffiliateEarnings(ae.data); setDriverEarnings(de.data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !revenue) return <div className="flex items-center justify-center h-64 text-slate-400">Loading finance data...</div>;

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}>Finance</h1>
        <p className="text-slate-500 text-sm">Revenue, payments, payouts, and commission across the platform.</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: tab === key ? '#0a0f1e' : '#fff', color: tab === key ? '#fff' : '#64748b', border: '1px solid', borderColor: tab === key ? '#0a0f1e' : '#e2e8f0' }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab !== 'revenue' && tab !== 'company' && (
        <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3 items-center" style={{ border: '1px solid #f0f0f0' }}>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm w-auto" />
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm w-auto" />
          {tab === 'payments' && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm w-auto">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          )}
          {(tab === 'affiliate' || tab === 'driver') && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm w-auto">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
            </select>
          )}
        </div>
      )}

      {tab === 'revenue' && revenue && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Daily revenue" value={`£${revenue.dailyRevenue.toLocaleString()}`} />
          <StatCard label="Weekly revenue" value={`£${revenue.weeklyRevenue.toLocaleString()}`} />
          <StatCard label="Monthly revenue" value={`£${revenue.monthlyRevenue.toLocaleString()}`} />
          <StatCard label="Annual revenue" value={`£${revenue.annualRevenue.toLocaleString()}`} />
          <StatCard label="Total revenue (all time)" value={`£${revenue.totalRevenue.toLocaleString()}`} />
          <StatCard label="RP commission (all time)" value={`£${revenue.totalRpCommission.toLocaleString()}`} />
        </div>
      )}

      {tab === 'company' && company && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="RP commission" value={`£${company.rpCommission.toLocaleString()}`} />
          <StatCard label="Gross turnover" value={`£${company.grossTurnover.toLocaleString()}`} />
          <StatCard label="Total payouts" value={`£${company.totalPayouts.toLocaleString()}`} />
          <StatCard label="Operational revenue" value={`£${company.operationalRevenue.toLocaleString()}`} />
        </div>
      )}

      {tab === 'payments' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f9f9f9' }}>
            <p className="text-sm text-slate-500">{payments.length} payment records</p>
            <ExportButtons path="payments" params={filterParams} />
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50">{['Reference', 'Customer', 'Amount', 'Method', 'Status', 'Paid at'].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs">{p.bookingRef ?? '—'}</td>
                  <td className="px-4 py-3">{p.customerName}</td>
                  <td className="px-4 py-3 font-semibold">£{p.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">{p.method}</td>
                  <td className="px-4 py-3 capitalize">{p.status}</td>
                  <td className="px-4 py-3 text-slate-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-GB') : '—'}</td>
                </tr>
              ))}
              {!payments.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No payments found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {(tab === 'affiliate' || tab === 'driver') && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f9f9f9' }}>
            <p className="text-sm text-slate-500">{(tab === 'affiliate' ? affiliateEarnings : driverEarnings).length} earning records</p>
            <ExportButtons path="earnings" params={{ ...filterParams, entityType: tab === 'affiliate' ? 'affiliate' : 'driver' }} />
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50">{['Booking', tab === 'affiliate' ? 'Affiliate' : 'Driver', 'Gross', 'Commission', 'Net payout', 'Status', 'Date'].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-50">
              {(tab === 'affiliate' ? affiliateEarnings : driverEarnings).map(e => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-mono text-xs">{e.bookingRef}</td>
                  <td className="px-4 py-3">{e.entityName}</td>
                  <td className="px-4 py-3">£{e.grossAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">£{e.commissionDeducted.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold">£{e.netAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">{e.status}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
              {!(tab === 'affiliate' ? affiliateEarnings : driverEarnings).length && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No earning records found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
