import type { Metadata } from 'next';
import PublicLayout from '@/components/layout/PublicLayout';
import BookingWidget from '@/components/home/BookingWidget';
import HeroSection from '@/components/home/HeroSection';
import VehicleCategoryStrip from '@/components/home/VehicleCategoryStrip';
import PromoBanner from '@/components/home/PromoBanner';
import { getCategories, getPage, getPromotions } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home');
  return {
    title: page.seoTitle,
    description: page.metaDescription,
    openGraph: { title: page.ogTitle, description: page.ogDescription },
  };
}

export default async function HomePage() {
  const [page, categories, promotions] = await Promise.all([
    getPage('home'),
    getCategories(),
    getPromotions(),
  ]);
  const sections = page.sections.filter(section => section.visible).sort((a, b) => a.order - b.order);
  const hero = sections.find(section => section.type === 'hero');
  const fleet = sections.find(section => section.type === 'fleet_strip');
  const promo = sections.find(section => section.type === 'promo_banner');

  return (
    <PublicLayout>
      <BookingWidget />
      {hero && <HeroSection content={hero.content} />}
      {fleet && <VehicleCategoryStrip fleetCategories={categories} content={fleet.content} />}
      {promo && <PromoBanner promotions={promotions} label={String(promo.content.label || 'Limited Offer')} />}
    </PublicLayout>
  );
}
