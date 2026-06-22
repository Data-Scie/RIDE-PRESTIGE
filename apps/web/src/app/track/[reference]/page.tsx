import TrackClient from './TrackClient';
import PublicLayout from '@/components/layout/PublicLayout';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Track Your Ride', description: 'Live status and driver location for your Ride Prestige booking.' };

export default async function TrackPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return (
    <PublicLayout>
      <TrackClient reference={reference} />
    </PublicLayout>
  );
}
