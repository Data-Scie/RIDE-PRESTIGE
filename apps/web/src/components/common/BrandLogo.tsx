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
  // Source image is 565x622 (padded for breathing room around the mark) — height follows from width directly.
  const renderedWidth = Math.round(width);

  return (
    <span className={`inline-flex items-center overflow-visible ${className}`} style={{ lineHeight: 0, paddingTop: 2, paddingBottom: 2 }}>
      <Image
        src={src}
        alt={alt}
        width={renderedWidth}
        height={Math.round(renderedWidth * 1.101)}
        style={{ width: renderedWidth, height: 'auto', objectFit: 'contain', display: 'block' }}
        priority
      />
    </span>
  );
}
