import { getVehicles, getCategories } from '@/lib/kv';
import FleetClient from './FleetClient';

export default async function FleetPage() {
  const [vehicles, fleetCategories] = await Promise.all([getVehicles(), getCategories()]);
  return <FleetClient vehicles={vehicles} fleetCategories={fleetCategories} />;
}
