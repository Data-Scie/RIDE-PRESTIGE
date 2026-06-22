import MyBookingsClient from './MyBookingsClient';
import PublicLayout from '@/components/layout/PublicLayout';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'My Bookings', description: 'Your Ride Prestige booking history.' };

export default function MyBookingsPage() {
  return (
    <PublicLayout>
      <MyBookingsClient />
    </PublicLayout>
  );
}
