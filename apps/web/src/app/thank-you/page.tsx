import { Suspense } from 'react';
import ThankYouClient from './ThankYouClient';
import PublicLayout from '@/components/layout/PublicLayout';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Booking Confirmed', description: 'Your Ride Prestige booking is confirmed.' };

export default function ThankYouPage() {
  return (
    <PublicLayout>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{background:'#f4f5f8'}}><div className="w-10 h-10 border-4 border-t-yellow-600 border-yellow-200 rounded-full animate-spin" /></div>}>
        <ThankYouClient />
      </Suspense>
    </PublicLayout>
  );
}
