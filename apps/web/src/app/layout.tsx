import type { Metadata } from 'next';
import './globals.css';
import { siteSettings } from '@/lib/data';

export const metadata: Metadata = {
  title: { default: siteSettings.seoDefaults.title, template: '%s | Ride Prestige' },
  description: siteSettings.seoDefaults.description,
  openGraph: { title: siteSettings.seoDefaults.title, description: siteSettings.seoDefaults.description, type: 'website', locale: 'en_GB', siteName: 'Ride Prestige' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
