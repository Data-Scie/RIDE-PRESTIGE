import PublicLayout from '@/components/layout/PublicLayout';
import RateRideClient from './RateRideClient';

export const dynamic = 'force-dynamic';

export default function RateRidePage() {
  return (
    <PublicLayout>
      <RateRideClient />
    </PublicLayout>
  );
}
