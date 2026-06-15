import Link from 'next/link';
import MapPreview from '@/components/map/MapPreview';

export default function HeroSection({ content = {} }: { content?: Record<string, unknown> }) {
  return (
    <section style={{ background: '#000000', minHeight: '88vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      {/* Sheffield Map Background */}
      <MapPreview style={{ position: 'absolute', inset: 0, zIndex: 0 }} showOverlay />

      {/* Content overlay */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', alignItems: 'center' }}>

          {/* Left: headline */}
          <div>
            <p style={{ color: '#c9a84c', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              {String(content.eyebrow || 'Sheffield & South Yorkshire')}
            </p>
            <h2 style={{ fontFamily: 'Playfair Display,Georgia,serif', fontSize: 'clamp(2.1rem, 5vw, 4rem)', fontWeight: 600, color: '#ffffff', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              {String(content.title || 'Coach and minibus hire')}<br />
              <span style={{ color: '#c9a84c' }}>{String(content.highlightedTitle || 'for every group journey.')}</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '2.5rem', maxWidth: '26rem' }}>
              {String(content.description || 'Dependable coach and minibus transport across Sheffield and the UK. Professional drivers, seamless airport transfers, corporate travel and event logistics.')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.9rem 2rem', background: '#c9a84c', color: '#000000', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
                {String(content.primaryCtaLabel || 'Book Now')}
              </Link>
              <Link href="/fleet" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                {String(content.secondaryCtaLabel || 'View our fleet')} &rarr;
              </Link>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {[
                { v: String(content.stat1Value || '10K+'), l: String(content.stat1Label || 'Journeys') },
                { v: String(content.stat2Value || '4.9★'), l: String(content.stat2Label || 'Rating') },
                { v: String(content.stat3Value || '24/7'), l: String(content.stat3Label || 'Service') },
                { v: String(content.stat4Value || '50+'), l: String(content.stat4Label || 'Drivers') },
              ].map(s => (
                <div key={s.l}>
                  <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>{s.v}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem' }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
