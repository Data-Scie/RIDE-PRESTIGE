'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const CONSENT_KEY = 'rp_cookie_consent';
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type Consent = 'accepted' | 'rejected' | null;

export default function CookieConsentBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsent(window.localStorage.getItem(CONSENT_KEY) as Consent);
    setHydrated(true);
  }, []);

  const decide = (value: 'accepted' | 'rejected') => {
    window.localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
  };

  if (!hydrated) return null;

  return (
    <>
      {consent === 'accepted' && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });`}
          </Script>
        </>
      )}

      {consent === null && (
        <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-5" role="dialog" aria-label="Cookie consent">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-sm text-slate-600 flex-1">
              We use cookies to understand site traffic and improve your experience. Read our{' '}
              <a href="/privacy-policy" className="underline" style={{ color: '#c9a84c' }}>Privacy Policy</a>.
            </p>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => decide('rejected')} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100">
                Reject
              </button>
              <button onClick={() => decide('accepted')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#0a0f1e' }}>
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
