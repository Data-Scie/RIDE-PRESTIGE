'use client';

import { useEffect, useMemo, useState } from 'react';
import { Banknote, Building2, Car, Download, Receipt, TrendingUp } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

type Tab = 'revenue' | 'payments' | 'affiliate' | 'driver' | 'company';

const TABS: { key: Tab; label: string; icon: typeof TrendingUp }[] = [
  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  { key: 'payments', label: 'Booking Payments', icon: Receipt },
  { key: 'affiliate', label: 'Affiliate Financials', icon: Building2 },
  { key: 'driver', label: 'Driver Financials', icon: Car },
  { key: 'company', label: 'Company Financials', icon: Banknote },
];

interface RevenueSummary {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  totalRevenue: number;
  totalRpCommission: number;
}

interface CompanySummary {
  rpCommission: number;
  grossTurnover: number;
  totalPayouts: number;
  totalRideExpenses?: number;
  independentDriverPayouts?: number;
  operationalRevenue: number;
}

interface PaymentRow {
  id: string;
  bookingRef: string | null;
  customerName: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface EarningRow {
  id: string;
  bookingRef: string;
  entityType: string;
  entityName: string;
  grossAmount: number;
  commissionDeducted: number;
  netAmount: number;
  status: string;
  date: string;
  fareAmount?: number;
  rideCommissionAmount?: number;
  operatorPayoutAmount?: number;
  driverPayoutAmount?: number;
  rideExpenseAmount?: number;
  companyNetAmount?: number;
  paymentStatus?: string;
}

const money = (value?: number | null) =>
  `GBP ${Number(value ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f0f0' }}>
    <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p
      className="text-2xl font-semibold"
      style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}
    >
      {value}
    </p>
  </div>
);

function exportUrl(path: string, format: 'csv' | 'pdf', params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, format }).toString();
  return `/api/backend/admin/finance/${path}?${qs}`;
}

function queryString(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : '';
}

async function optionalFinance<T>(request: Promise<{ success: boolean; data: T }>): Promise<T | null> {
  try {
    const result = await request;
    return result.data;
  } catch {
    return null;
  }
}

function ExportButtons({ path, params }: { path: string; params: Record<string, string> }) {
  return (
    <div className="flex gap-2">
      <a
        href={exportUrl(path, 'csv', params)}
        download={`${path}.csv`}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
      >
        <Download size={13} /> CSV
      </a>
      <a
        href={exportUrl(path, 'pdf', params)}
        download={`${path}.pdf`}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
      >
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

  const filterParams = useMemo<Record<string, string>>(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [dateFrom, dateTo, statusFilter]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [revenueRes, companyRes, paymentsRes, affiliateRes, driverRes] = await Promise.all([
          optionalFinance(adminApi.get<{ success: boolean; data: RevenueSummary }>('/api/admin/finance/revenue')),
          optionalFinance(adminApi.get<{ success: boolean; data: CompanySummary }>('/api/admin/finance/company')),
          optionalFinance(adminApi.get<{ success: boolean; data: PaymentRow[] }>(`/api/admin/finance/payments${queryString(filterParams)}`)),
          optionalFinance(adminApi.get<{ success: boolean; data: EarningRow[] }>(
            `/api/admin/finance/earnings${queryString({ ...filterParams, entityType: 'affiliate' })}`
          )),
          optionalFinance(adminApi.get<{ success: boolean; data: EarningRow[] }>(
            `/api/admin/finance/earnings${queryString({ ...filterParams, entityType: 'driver' })}`
          )),
        ]);

        if (cancelled) return;
        setRevenue(revenueRes);
        setCompany(companyRes);
        setPayments(paymentsRes ?? []);
        setAffiliateEarnings(affiliateRes ?? []);
        setDriverEarnings(driverRes ?? []);
        if (!revenueRes && !companyRes && !paymentsRes && !affiliateRes && !driverRes) {
          setError('Finance API is not available on the deployed backend yet. Redeploy the Render API to enable finance reporting.');
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load finance data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [filterParams]);

  const activeEarnings = tab === 'affiliate' ? affiliateEarnings : driverEarnings;

  if (loading && !revenue) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading finance data...</div>;
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'Playfair Display,Georgia,serif', color: '#0a0f1e' }}
        >
          Finance
        </h1>
        <p className="text-slate-500 text-sm">Revenue, payments, payouts, and ride commission across the platform.</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === key ? '#0a0f1e' : '#fff',
              color: tab === key ? '#fff' : '#64748b',
              border: '1px solid',
              borderColor: tab === key ? '#0a0f1e' : '#e2e8f0',
            }}
          >
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
        </div>
      )}

      {tab === 'revenue' && revenue && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard label="Today" value={money(revenue.dailyRevenue)} />
          <StatCard label="This week" value={money(revenue.weeklyRevenue)} />
          <StatCard label="This month" value={money(revenue.monthlyRevenue)} />
          <StatCard label="This year" value={money(revenue.annualRevenue)} />
          <StatCard label="All ride fares" value={money(revenue.totalRevenue)} />
          <StatCard label="All RP commission" value={money(revenue.totalRpCommission)} />
        </div>
      )}

      {tab === 'company' && company && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard label="Gross ride fares" value={money(company.grossTurnover)} />
          <StatCard label="RP ride commission" value={money(company.rpCommission)} />
          <StatCard label="Operator payouts" value={money(company.totalPayouts)} />
          <StatCard label="Ride expenses" value={money(company.totalRideExpenses ?? company.totalPayouts)} />
          <StatCard label="Independent driver payouts" value={money(company.independentDriverPayouts)} />
          <StatCard label="Operational revenue" value={money(company.operationalRevenue)} />
        </div>
      )}

      {tab === 'company' && !company && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
          Company finance is not available from the current backend deployment. The Render API needs redeploying so `/api/admin/finance/company` exists in production.
        </div>
      )}

      {tab === 'payments' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f9f9f9' }}>
            <p className="text-sm text-slate-500">{payments.length} payment records</p>
            <ExportButtons path="payments" params={filterParams} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {['Booking', 'Customer', 'Amount', 'Method', 'Status', 'Date'].map(header => (
                    <th key={header} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-mono text-xs">{payment.bookingRef ?? '-'}</td>
                    <td className="px-4 py-3">{payment.customerName}</td>
                    <td className="px-4 py-3 font-semibold">{money(payment.amount)}</td>
                    <td className="px-4 py-3 capitalize">{payment.method}</td>
                    <td className="px-4 py-3 capitalize">{payment.status}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                ))}
                {!payments.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      No payment records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(tab === 'affiliate' || tab === 'driver') && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f9f9f9' }}>
            <p className="text-sm text-slate-500">{activeEarnings.length} ride ledger records</p>
            <ExportButtons path="earnings" params={{ ...filterParams, entityType: tab }} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {[
                    'Booking',
                    tab === 'affiliate' ? 'Affiliate' : 'Driver',
                    'Customer fare',
                    'RP commission',
                    'Operator payout',
                    'Driver payout',
                    'Ride expense',
                    'Company net',
                    'Payout',
                    'Payment',
                    'Date',
                  ].map(header => (
                    <th key={header} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeEarnings.map(entry => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-mono text-xs">{entry.bookingRef}</td>
                    <td className="px-4 py-3">{entry.entityName}</td>
                    <td className="px-4 py-3 font-semibold">{money(entry.fareAmount ?? entry.grossAmount)}</td>
                    <td className="px-4 py-3 text-green-700">{money(entry.rideCommissionAmount ?? entry.commissionDeducted)}</td>
                    <td className="px-4 py-3">{money(entry.operatorPayoutAmount ?? entry.netAmount)}</td>
                    <td className="px-4 py-3">{money(entry.driverPayoutAmount)}</td>
                    <td className="px-4 py-3 text-red-600">{money(entry.rideExpenseAmount ?? entry.netAmount)}</td>
                    <td className="px-4 py-3 font-semibold">{money(entry.companyNetAmount)}</td>
                    <td className="px-4 py-3 capitalize">{entry.status}</td>
                    <td className="px-4 py-3 capitalize">{entry.paymentStatus ?? 'pending'}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(entry.date).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
                {!activeEarnings.length && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                      No ride ledger records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
