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
  const renderedWidth = Math.round(width * 0.84);

  return (
    <Image
      src="/brand/ride-prestige-mark.png"
      alt={alt}
      width={renderedWidth}
      height={Math.round(renderedWidth * 1.047)}
      className={className}
      style={{ width: renderedWidth, height: 'auto', objectFit: 'contain' }}
      priority
    />
  );
}
