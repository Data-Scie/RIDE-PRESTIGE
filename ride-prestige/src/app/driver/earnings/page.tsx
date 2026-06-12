'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Star } from 'lucide-react';
import { driverApi } from '@/lib/api-client';

interface EarningsData {
  today: number; thisWeek: number; thisMonth: number;
  rating?: number; totalJobs: number;
  weekly: { day: string; amount: number; rides: number }[];
}

export default function DriverEarningsPage() {
  const [data, setData]     = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driverApi.get<{ success: boolean; data: EarningsData }>('/api/driver/earnings')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading earnings…</div>;

  const weekly = data?.weekly ?? [
    { day: 'Mon', amount: 0, rides: 0 }, { day: 'Tue', amount: 0, rides: 0 },
    { day: 'Wed', amount: 0, rides: 0 }, { day: 'Thu', amount: 0, rides: 0 },
    { day: 'Fri', amount: 0, rides: 0 }, { day: 'Sat', amount: 0, rides: 0 }, { day: 'Sun', amount: 0, rides: 0 },
  ];
  const max       = Math.max(...weekly.map(d => d.amount), 1);
  const weekTotal = data?.thisWeek ?? weekly.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display,Georgia,serif' }}>Earnings</h1>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today',     value: `£${data?.today ?? 0}`,    icon: TrendingUp, color: '#f59e0b' },
          { label: 'This Week', value: `£${weekTotal}`,           icon: Calendar,   color: '#10b981' },
          { label: 'Rating',    value: data?.rating ?? '—',       icon: Star,       color: '#f59e0b' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Icon size={16} style={{ color }} className="mb-2" />
            <p className="font-bold text-white text-lg">{value}</p>
            <p className="text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-semibold text-white mb-4">This Week</p>
        <div className="flex items-end gap-2 h-32">
          {weekly.map(({ day, amount }) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              {amount > 0 && <span className="text-xs text-amber-400 font-semibold">£{amount}</span>}
              <div className="w-full rounded-t-lg transition-all" style={{ height: `${(amount / max) * 80}px`, background: 'linear-gradient(to top,#d97706,#f59e0b)', minHeight: amount > 0 ? '4px' : '2px', opacity: amount > 0 ? 1 : 0.2 }} />
              <span className="text-xs text-zinc-500">{day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-semibold text-white mb-3">This Week Breakdown</p>
        <div className="space-y-2">
          {weekly.map(({ day, amount, rides }) => (
            <div key={day} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: amount > 0 ? '#f59e0b' : '#3f3f46' }} />
                <span className="text-sm text-white">{day}</span>
                <span className="text-xs text-zinc-500">{rides} ride{rides !== 1 ? 's' : ''}</span>
              </div>
              <span className="font-bold" style={{ color: amount > 0 ? '#f59e0b' : '#52525b' }}>£{amount}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold text-white">Total</span>
            <span className="font-bold text-amber-400 text-lg">£{weekTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
