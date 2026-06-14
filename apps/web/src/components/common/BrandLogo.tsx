import Image from 'next/image';

export default function BrandLogo({
  variant = 'full',
  width = variant === 'full' ? 170 : 42,
  className = '',
}: {
  variant?: 'full' | 'mark';
  width?: number;
  className?: string;
}) {
  const isFull = variant === 'full';
  return (
    <Image
      src={isFull ? '/brand/ride-prestige-logo.png' : '/brand/ride-prestige-mark.png'}
      alt="Ride Prestige"
      width={width}
      height={Math.round(width * (isFull ? 0.692 : 1.047))}
      className={className}
      style={{ width, height: 'auto', objectFit: 'contain' }}
      priority
    />
  );
}
