import Link from 'next/link';

const STEPS = [
  {
    num: '01',
    icon: '📍',
    title: 'Request a ride',
    desc: 'Enter your pickup location and destination. Get instant fare estimates across all vehicle types.',
  },
  {
    num: '02',
    icon: '💷',
    title: 'Confirm your fare',
    desc: 'Choose your vehicle — prestige, minibus or coach. Review the full fare breakdown before you commit.',
  },
  {
    num: '03',
    icon: '✓',
    title: 'Enjoy your journey',
    desc: 'Your professional, licensed driver arrives on time. Sit back and travel in comfort.',
  },
];

export default function HowToRide() {
  return (
    <section style={{ background: '#000000', padding: '7rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Heading */}
        <div style={{ marginBottom: '5rem' }}>
          <p
            style={{
              color: '#c9a84c',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            Simple process
          </p>
          <h2
            style={{
              fontFamily: 'Playfair Display,Georgia,serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.15,
              maxWidth: '28rem',
            }}
          >
            How to ride with Prestige
          </h2>
        </div>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '3rem',
            position: 'relative',
          }}
        >
          {STEPS.map((step, i) => (
            <div key={step.num} style={{ position: 'relative' }}>
              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '1.25rem',
                    left: 'calc(100% + 0.5rem)',
                    width: 'calc(3rem - 1rem)',
                    height: '1px',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'none', // shown via CSS on lg+
                  }}
                  className="lg-connector"
                />
              )}

              {/* Step number */}
              <p
                style={{
                  fontFamily: 'Playfair Display,Georgia,serif',
                  fontSize: '3.5rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.06)',
                  lineHeight: 1,
                  marginBottom: '1.25rem',
                  letterSpacing: '-0.02em',
                }}
              >
                {step.num}
              </p>

              {/* Icon */}
              <p style={{ fontSize: '1.75rem', marginBottom: '0.875rem' }}>{step.icon}</p>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'Playfair Display,Georgia,serif',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  marginBottom: '0.75rem',
                }}
              >
                {step.title}
              </h3>

              {/* Desc */}
              <p
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.875rem',
                  lineHeight: 1.75,
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: '5rem',
            paddingTop: '4rem',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'Playfair Display,Georgia,serif',
                fontSize: '1.6rem',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '0.5rem',
              }}
            >
              Ready to book?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
              Get an instant fare estimate in seconds. No payment needed upfront.
            </p>
          </div>
          <Link
            href="/book"
            className="hover:opacity-80 transition-opacity"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.875rem 2rem',
              background: '#ffffff',
              color: '#000000',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            Book a ride
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
