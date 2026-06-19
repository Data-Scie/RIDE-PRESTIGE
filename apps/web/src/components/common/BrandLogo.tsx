import Image from 'next/image';

export default function BrandLogo({
  width = 40,
  className = '',
  src = '/brand/ride-prestige-mark.png',
  alt = 'Ride Prestige',
}: {
  width?: number;
  className?: string;
  src?: string;
  alt?: string;
}) {
  // Source image is 489x512 (~0.955 width:height) — height follows from width directly.
  const renderedWidth = Math.round(width);

  return (
    <Image
      src={src}
      alt={alt}
      width={renderedWidth}
      height={Math.round(renderedWidth * 1.047)}
      className={className}
      style={{ width: renderedWidth, height: 'auto', objectFit: 'contain' }}
      priority
    />
  );
}
