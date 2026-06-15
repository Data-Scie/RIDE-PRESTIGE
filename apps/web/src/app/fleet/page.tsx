import PublicLayout from '@/components/layout/PublicLayout';
import { getVehicles, getCategories } from '@/lib/cms';
import FleetClient from './FleetClient';

export default async function FleetPage() {
  const [vehicles, fleetCategories] = await Promise.all([getVehicles(), getCategories()]);
  return (
    <PublicLayout>
      <FleetClient vehicles={vehicles} fleetCategories={fleetCategories} />
    </PublicLayout>
  );
}
