import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: 'gold' | 'green' | 'blue' | 'red';
  href?: string;
}

const accents = {
  gold:  { bg:'rgba(201,168,76,0.08)',  icon:'#c9a84c',  border:'rgba(201,168,76,0.15)' },
  green: { bg:'rgba(34,197,94,0.08)',   icon:'#16a34a',  border:'rgba(34,197,94,0.15)'  },
  blue:  { bg:'rgba(59,130,246,0.08)',  icon:'#2563eb',  border:'rgba(59,130,246,0.15)' },
  red:   { bg:'rgba(239,68,68,0.08)',   icon:'#dc2626',  border:'rgba(239,68,68,0.15)'  },
};

export default function DashboardCard({ title, value, subtitle, icon:Icon, trend, accent='gold', href }: DashboardCardProps) {
  const a = accents[accent];
  const content = (
    <div className="bg-white rounded-2xl p-6 transition-shadow duration-300 hover:shadow-lg h-full"
      style={{border:`1px solid ${a.border}`, cursor: href ? 'pointer' : undefined}}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:a.bg}}>
          <Icon size={18} style={{color:a.icon}} />
        </div>
        {trend && (
          <span className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              background: trend.positive ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              color: trend.positive ? '#16a34a' : '#dc2626',
            }}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <p className="font-bold text-2xl mb-1" style={{fontFamily:'Playfair Display,Georgia,serif',color:'#0a0f1e'}}>{value}</p>
      <p className="text-sm font-medium" style={{color:'#1a1f2e'}}>{title}</p>
      {subtitle && <p className="text-xs mt-0.5" style={{color:'#8b8fa8'}}>{subtitle}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : content;
}
