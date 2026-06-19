import type { WebsiteVehicle } from '../types';

export const DEFAULT_WEBSITE_VEHICLES: WebsiteVehicle[] = [
  {
    id: 'wv-p1', categorySlug: 'prestige', name: 'Range Rover', badge: 'Most Popular',
    description: 'The pinnacle of British luxury SUVs. Commanding presence, supreme comfort and advanced technology.',
    passengers: 4, luggage: '4 large cases',
    features: ['Heated leather seats', 'Panoramic sunroof', 'Climate control', 'Wi-Fi on board', 'Professional chauffeur', 'Meet & greet service'],
    imageUrl: 'https://images.unsplash.com/photo-1563458563737-e60b1f1b345f?fm=jpg&q=80&w=800', available: true, priceNote: '',
  },
  {
    id: 'wv-p2', categorySlug: 'prestige', name: 'Mercedes Vito Executive',
    description: 'Unparalleled space and luxury for up to 7 passengers. Perfect for corporate group travel.',
    passengers: 7, luggage: '7 large cases',
    features: ['Leather captain seats', 'Individual climate zones', 'Entertainment screens', 'USB & wireless charging', 'Privacy glass', 'Professional chauffeur'],
    imageUrl: 'https://images.pexels.com/photos/17455625/pexels-photo-17455625.jpeg?cs=srgb&fm=jpg&w=800', available: true, priceNote: '',
  },
  {
    id: 'wv-m1', categorySlug: 'minibus', name: '16-Seater Minibus', badge: 'Standard',
    description: 'Spacious air-conditioned minibus for airport transfers, corporate group travel, and private outings.',
    passengers: 16, luggage: 'Up to 10 large cases',
    features: ['Air conditioning', 'High-back seats', 'Luggage trailer available', 'USB charging points', 'Uniformed driver', 'Door-to-door service'],
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?fm=jpg&q=80&w=800', available: true, priceNote: '',
  },
  {
    id: 'wv-m2', categorySlug: 'minibus', name: '24-Seater Minibus', badge: 'Best Value',
    description: 'Ideal for school trips, sports teams, airport groups, and family transfers across Sheffield and beyond.',
    passengers: 24, luggage: 'Up to 16 large cases',
    features: ['Full air conditioning', 'Reclining seats', 'Large rear luggage bay', 'USB charging points', 'Uniformed driver', 'DDA access available'],
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?fm=jpg&q=80&w=800', available: true, priceNote: '',
  },
  {
    id: 'wv-m3', categorySlug: 'minibus', name: '32-Seater Midi Coach', badge: 'Group Travel',
    description: 'A comfortable midi coach for medium-sized groups needing extra capacity without moving to a full coach.',
    passengers: 32, luggage: 'Up to 24 large cases',
    features: ['Air conditioning', 'Reclining seats', 'PA system', 'Large luggage storage', 'Seat belts', 'Professional driver'],
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?fm=jpg&q=80&w=800', available: true, priceNote: '',
  },
  {
    id: 'wv-c1', categorySlug: 'coaches', name: '44-Seater Coach', badge: 'Best Value',
    description: 'Executive coach for events, corporate excursions, school trips, and long-distance group travel.',
    passengers: 44, luggage: 'Underfloor luggage bay',
    features: ['Air conditioning', 'Reclining seats', 'Underfloor luggage', 'Entertainment system', 'Free Wi-Fi', 'PA microphone'],
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?fm=jpg&q=80&w=800', available: true, priceNote: '',
  },
  {
    id: 'wv-c2', categorySlug: 'coaches', name: '53-Seater Executive Coach', badge: 'Executive',
    description: 'Full-size executive coach for larger groups, corporate travel, private hire, and UK-wide journeys.',
    passengers: 53, luggage: 'Large underfloor luggage bay',
    features: ['Executive reclining seats', 'Air conditioning', 'WC available', 'USB charging', 'PA system', 'Professional driver'],
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?fm=jpg&q=80&w=800', available: true, priceNote: '',
  },
  {
    id: 'wv-c3', categorySlug: 'coaches', name: '60-Seater Coach', badge: 'Large Groups',
    description: 'High-capacity coach for school movements, events, conferences, and large private groups.',
    passengers: 60, luggage: 'Large underfloor luggage bay',
    features: ['Air conditioning', 'Reclining seats', 'Seat belts', 'PA system', 'Luggage storage', 'Fully licensed'],
    imageUrl: 'https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?fm=jpg&q=80&w=800', available: true, priceNote: '',
  },
  {
    id: 'wv-t1', categorySlug: 'taxi', name: 'Toyota Corolla',
    description: 'A reliable and efficient saloon taxi for everyday journeys across Sheffield.',
    passengers: 4, luggage: '2 medium cases',
    features: ['Air conditioning', 'GPS navigation', 'Card payments accepted', 'Fully licensed & insured'],
    imageUrl: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?fm=jpg&q=80&w=800', available: true, priceNote: '',
  },
];
