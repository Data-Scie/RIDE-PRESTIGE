import type { Metadata } from 'next';
import { Suspense } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import PricesClient from './PricesClient';
import { getPricing } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Fare Estimates — Ride Prestige',
  description: 'Compare prices for minibus, coach, and prestige vehicle hire across the UK.',
};

export default async function PricesPage() {
  const pricing = await getPricing();
  return (
    <PublicLayout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f5f8' }}>
          <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin" />
        </div>
      }>
        <PricesClient pricing={pricing} />
      </Suspense>
    </PublicLayout>
  );
}
