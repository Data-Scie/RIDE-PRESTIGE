import Image from 'next/image';

export default function BrandLogo({
  width = 72,
  className = '',
  alt = 'Ride Prestige',
}: {
  variant?: 'full' | 'mark';
  width?: number;
  className?: string;
  src?: string;
  alt?: string;
}) {
  return (
    <Image
      src="/brand/ride-prestige-mark.png"
      alt={alt}
      width={width}
      height={Math.round(width * 1.047)}
      className={className}
      style={{ width, height: 'auto', objectFit: 'contain' }}
      priority
    />
  );
}
