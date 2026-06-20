import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';
import { getLayoutCms } from '@/lib/cms';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { settings, navigation } = await getLayoutCms();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rideprestige.co.uk';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings.siteName || 'Ride Prestige',
    description: settings.tagline || settings.seoDefaults?.description,
    url: baseUrl,
    image: settings.logoUrl ? `${baseUrl}${settings.logoUrl}` : undefined,
    telephone: settings.phoneNumber || undefined,
    email: settings.contactEmail || undefined,
    address: settings.address ? { '@type': 'PostalAddress', streetAddress: settings.address, addressCountry: 'GB' } : undefined,
    areaServed: 'GB',
    priceRange: '££-£££',
    sameAs: Object.values(settings.socialLinks || {}).filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header navigation={navigation} settings={settings} />
      <main>{children}</main>
      <Footer settings={settings} />
      <CookieConsentBanner />
    </>
  );
}
