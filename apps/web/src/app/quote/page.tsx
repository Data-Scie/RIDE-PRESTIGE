import { Suspense } from 'react';
import QuoteClient from './QuoteClient';
import PublicLayout from '@/components/layout/PublicLayout';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your Quote',
  description: 'Review your Ride Prestige fare estimate before confirming your journey.',
};

export default function QuotePage() {
  return (
    <PublicLayout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center" style={{background:'#f4f5f8'}}>
          <div className="w-10 h-10 border-4 border-t-yellow-600 border-yellow-200 rounded-full animate-spin" />
        </div>
      }>
        <QuoteClient />
      </Suspense>
    </PublicLayout>
  );
}
