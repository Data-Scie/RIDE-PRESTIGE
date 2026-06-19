export default function BrandLogo({
  variant = 'full',
  width = variant === 'full' ? 170 : 42,
  className = '',
  alt = 'Ride Prestige',
}: {
  variant?: 'full' | 'mark';
  width?: number;
  className?: string;
  src?: string;
  alt?: string;
}) {
  const isFull = variant === 'full';
  const markSize = isFull ? Math.max(30, Math.round(width * 0.31)) : width;
  const textSize = Math.max(18, Math.round(width * 0.13));
  const subTextSize = Math.max(7, Math.round(width * 0.045));

  if (!isFull) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        role="img"
        aria-label={alt}
        style={{
          width,
          height: width,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #f4d779 0%, #c9a84c 48%, #9f7928 100%)',
          color: '#0a0f1e',
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 800,
          fontSize: Math.round(width * 0.58),
          lineHeight: 1,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.45)',
        }}
      >
        R
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 shrink-0 ${className}`}
      aria-label={alt}
      style={{ width, maxWidth: '100%' }}
    >
      <span
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: markSize,
          height: markSize,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #f4d779 0%, #c9a84c 48%, #9f7928 100%)',
          color: '#0a0f1e',
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 800,
          fontSize: Math.round(markSize * 0.58),
          lineHeight: 1,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.45)',
        }}
      >
        R
      </span>
      <span className="min-w-0 leading-none">
        <span
          className="block whitespace-nowrap"
          style={{
            color: '#0a0f1e',
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700,
            fontSize: textSize,
            lineHeight: 1,
          }}
        >
          Ride Prestige
        </span>
        <span
          className="block uppercase whitespace-nowrap"
          style={{
            color: '#c9a84c',
            fontWeight: 700,
            fontSize: subTextSize,
            letterSpacing: '0.16em',
            marginTop: 4,
          }}
        >
          Premium Transport
        </span>
      </span>
    </span>
  );
}
