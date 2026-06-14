import { Suspense } from 'react';
import BookPageClient from './BookPageClient';
import PublicLayout from '@/components/layout/PublicLayout';

export const metadata = {
  title: 'Book Your Journey',
  description: 'Complete your booking with Ride Prestige. Enter your journey details for an instant quote.',
};

export default function BookPage() {
  return (
    <PublicLayout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center" style={{background:'#f4f5f8'}}>
          <div className="w-10 h-10 border-4 border-t-yellow-600 border-yellow-200 rounded-full animate-spin" />
        </div>
      }>
        <BookPageClient />
      </Suspense>
    </PublicLayout>
  );
}
