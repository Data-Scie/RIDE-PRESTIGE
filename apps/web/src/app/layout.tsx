import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/common/Providers';

export const metadata: Metadata = {
  title: { default: 'Ride Prestige', template: '%s | Ride Prestige' },
  description: 'Premium coach, minibus, taxi, and prestige transport services.',
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
