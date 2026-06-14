import { Star } from 'lucide-react';

export default function StarRating({
  value,
  showValue = true,
  size = 14,
}: {
  value?: number | null;
  showValue?: boolean;
  size?: number;
}) {
  if (!value) return <span className="text-xs text-slate-400">Not rated</span>;
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${value} out of 5 stars`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map(star => (
          <Star key={star} size={size} className={star <= rounded ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
        ))}
      </span>
      {showValue && <span className="text-xs font-semibold text-slate-600">{value.toFixed(1)}</span>}
    </span>
  );
}
