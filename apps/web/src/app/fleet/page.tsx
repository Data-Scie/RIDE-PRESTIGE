export const dynamic = 'force-dynamic';
import PublicLayout from '@/components/layout/PublicLayout';
import { getVehicles, getCategories, getPage } from '@/lib/cms';
import FleetClient from './FleetClient';

export default async function FleetPage() {
  const [vehicles, fleetCategories, page] = await Promise.all([
    getVehicles(),
    getCategories(),
    getPage('fleet').catch(() => null),
  ]);
  const introSection = page?.sections.find(section => section.type === 'page_intro' && section.visible);
  const intro = introSection
    ? { title: String(introSection.content.title ?? ''), description: String(introSection.content.introduction ?? '') }
    : undefined;
  return (
    <PublicLayout>
      <FleetClient vehicles={vehicles} fleetCategories={fleetCategories} intro={intro} />
    </PublicLayout>
  );
}
