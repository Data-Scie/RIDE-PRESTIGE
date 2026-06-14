import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookingWidget from '@/components/home/BookingWidget';
import HeroSection from '@/components/home/HeroSection';

export const metadata: Metadata = {
  title: 'Ride Prestige — Coach & Minibus Hire UK',
  description: 'Coach and minibus hire across Sheffield and the UK. Professional group transport for events, airport transfers and corporate journeys.',
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <BookingWidget />
        <HeroSection />
      </main>
      <Footer />
    </>
  );
}
