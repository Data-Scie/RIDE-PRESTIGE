const styles: Record<string, {bg:string; color:string; border:string}> = {
  pending:     { bg:'rgba(245,158,11,0.08)', color:'#b45309', border:'rgba(245,158,11,0.25)' },
  quoted:      { bg:'rgba(59,130,246,0.08)', color:'#1d4ed8', border:'rgba(59,130,246,0.25)' },
  accepted:    { bg:'rgba(34,197,94,0.08)',  color:'#15803d', border:'rgba(34,197,94,0.25)'  },
  rejected:    { bg:'rgba(239,68,68,0.08)',  color:'#dc2626', border:'rgba(239,68,68,0.25)'  },
  completed:   { bg:'rgba(201,168,76,0.1)',  color:'#a07c30', border:'rgba(201,168,76,0.25)' },
  cancelled:   { bg:'rgba(156,163,175,0.1)', color:'#6b7280', border:'rgba(156,163,175,0.2)' },
  open:        { bg:'rgba(239,68,68,0.08)',  color:'#dc2626', border:'rgba(239,68,68,0.25)'  },
  in_progress: { bg:'rgba(59,130,246,0.08)', color:'#1d4ed8', border:'rgba(59,130,246,0.25)' },
  resolved:    { bg:'rgba(34,197,94,0.08)',  color:'#15803d', border:'rgba(34,197,94,0.25)'  },
  active:      { bg:'rgba(34,197,94,0.08)',  color:'#15803d', border:'rgba(34,197,94,0.25)'  },
  inactive:    { bg:'rgba(156,163,175,0.1)', color:'#6b7280', border:'rgba(156,163,175,0.2)' },
  review:      { bg:'rgba(139,92,246,0.08)', color:'#7c3aed', border:'rgba(139,92,246,0.25)' },
};

const labels: Record<string,string> = {
  pending:'Pending', quoted:'Quoted', accepted:'Accepted', rejected:'Rejected',
  completed:'Completed', cancelled:'Cancelled', open:'Open',
  in_progress:'In Progress', resolved:'Resolved', active:'Active',
  inactive:'Inactive', review:'Under Review',
};

export default function StatusBadge({ status }: { status: string }) {
  const s = styles[status] || { bg:'#f3f4f6', color:'#6b7280', border:'#e5e7eb' };
  return (
    <span className="status-badge" style={{background:s.bg, color:s.color, border:`1px solid ${s.border}`}}>
      {labels[status] || status}
    </span>
  );
}
