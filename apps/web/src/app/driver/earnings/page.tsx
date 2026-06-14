'use client';

import { useEffect, useState } from 'react';
import { Banknote, Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { driverApi } from '@/lib/api-client';

interface Earning {
  id: string;
  bookingRef: string;
  date: string;
  netAmount: number;
  status: string;
}

interface Summary {
  today: number;
  thisWeek: number;
  total: number;
  paid: number;
  pending: number;
  jobCount: number;
}

export default function DriverEarningsPage() {
  const [entries, setEntries] = useState<Earning[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    driverApi.get<{ success: boolean; data: Earning[]; summary: Summary }>('/api/driver/earnings')
      .then(result => { setEntries(result.data); setSummary(result.summary); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading earnings...</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div><h1 className="text-2xl font-bold text-slate-800">Earnings</h1><p className="text-sm text-slate-500">Your ride income and payout status</p></div>
      {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: summary?.today ?? 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'This Week', value: summary?.thisWeek ?? 0, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Payout', value: summary?.pending ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'All-Time Earnings', value: summary?.total ?? 0, icon: Banknote, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"><div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg} ${color}`}><Icon size={18} /></div><p className="text-2xl font-bold text-slate-800">£{value.toFixed(2)}</p><p className="text-xs text-slate-500 mt-1">{label}</p></div>)}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between"><h2 className="font-semibold text-slate-800">Earning Transactions</h2><span className="text-xs text-slate-400">{summary?.jobCount ?? entries.length} paid rides</span></div>
        <div className="divide-y divide-slate-50">
          {entries.map(entry => <div key={entry.id} className="px-5 py-4 flex items-center gap-4"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${entry.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{entry.status === 'paid' ? <CheckCircle size={17} /> : <Clock size={17} />}</div><div className="flex-1"><p className="font-mono text-sm font-semibold text-slate-700">{entry.bookingRef}</p><p className="text-xs text-slate-400">{new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><div className="text-right"><p className="font-bold text-slate-800">£{entry.netAmount.toFixed(2)}</p><p className={`text-xs capitalize ${entry.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>{entry.status}</p></div></div>)}
          {!entries.length && <div className="py-14 text-center text-sm text-slate-400">Earnings will appear after your first completed ride.</div>}
        </div>
      </div>
    </div>
  );
}
