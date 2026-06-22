import { Suspense } from 'react';
import BookPageClient from './BookPageClient';
import PublicLayout from '@/components/layout/PublicLayout';
import LocationPermissionGate from '@/components/common/LocationPermissionGate';
import { getPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Book Your Journey',
  description: 'Complete your booking with Ride Prestige. Enter your journey details for an instant quote.',
};

export default async function BookPage() {
  const page = await getPage('book').catch(() => null);
  const introSection = page?.sections.find(section => section.type === 'page_intro' && section.visible);
  const intro = introSection
    ? { title: String(introSection.content.title ?? ''), description: String(introSection.content.introduction ?? '') }
    : undefined;
  return (
    <PublicLayout>
      <LocationPermissionGate>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center" style={{background:'#f4f5f8'}}>
            <div className="w-10 h-10 border-4 border-t-yellow-600 border-yellow-200 rounded-full animate-spin" />
          </div>
        }>
          <BookPageClient intro={intro} />
        </Suspense>
      </LocationPermissionGate>
    </PublicLayout>
  );
}
