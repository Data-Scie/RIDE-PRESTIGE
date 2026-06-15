import type {
  Vehicle, FleetCategory, PricingConfig, CancellationPolicy,
  SiteSettings, NavigationItem, Booking, SupportTicket, Promotion, FAQItem, Page,
} from '@/types';

// Image URLs — free verified stock photos (Unsplash / Pexels)
// Update any URL via Admin → Pricing Manager or directly in this file
const IMG = {
  rangeRover:       'https://images.unsplash.com/photo-1563458563737-e60b1f1b345f?fm=jpg&q=80&w=800&auto=format&fit=crop',
  mercedesVito:     'https://images.pexels.com/photos/17455625/pexels-photo-17455625.jpeg?cs=srgb&fm=jpg&w=800&fit=crop&h=500',
  bmw5Series:       'https://i.ibb.co/1Ycjnwpr/Chat-GPT-Image-Jun-1-2026-01-40-41-PM-1.png',
  bentleyFlyingSpur:'https://images.unsplash.com/photo-1729513393829-7cf086494232?fm=jpg&q=80&w=800&auto=format&fit=crop',
  rollsRoycePhantom:'https://i.ibb.co/RGp92j7c/Chat-GPT-Image-Jun-1-2026-01-40-41-PM-3-Copy.png',
  mercedesSClass:   'https://i.ibb.co/mx8qY62/Chat-GPT-Image-Jun-1-2026-01-40-41-PM-2.png',
  mercedesEClass:   'https://images.unsplash.com/photo-1551836989-b4622a17a792?fm=jpg&q=80&w=800&auto=format&fit=crop',
  bentleyBentayga:  'https://images.unsplash.com/photo-1712409311262-6edb6aa22726?fm=jpg&q=80&w=800&auto=format&fit=crop',
  minibus1:         'https://i.ibb.co/hz2bGzK/Chat-GPT-Image-Jun-1-2026-12-56-51-PM-5.png',
  minibus2:         'https://i.ibb.co/3yW25BKb/Chat-GPT-Image-Jun-1-2026-12-56-51-PM-6.png',
  minibus3:         'https://i.ibb.co/qMy0dCx3/Chat-GPT-Image-Jun-1-2026-12-56-49-PM-1.png',
  coach1:           'https://i.ibb.co/4hFdSX4/Chat-GPT-Image-Jun-1-2026-01-21-50-PM-3.png',
  coach2:           'https://i.ibb.co/TBrbNfZb/Chat-GPT-Image-Jun-1-2026-01-21-50-PM-4.png',
  coach3:           'https://i.ibb.co/QFx82pcr/Chat-GPT-Image-Jun-1-2026-01-21-50-PM-5.png',
  coach4:           'https://i.ibb.co/cKWG8JJh/Chat-GPT-Image-Jun-1-2026-01-21-50-PM-6.png',
  coach5:           'https://i.ibb.co/G3sRy21v/Chat-GPT-Image-Jun-1-2026-01-21-50-PM-1.png',
  coach6:           'https://i.ibb.co/GvjS56qr/Chat-GPT-Image-Jun-1-2026-01-21-50-PM-2.png',
  taxiYellow:       'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?fm=jpg&q=80&w=800&auto=format&fit=crop',
  taxiWhite:        'https://images.unsplash.com/photo-1675311183084-755007dbb223?fm=jpg&q=80&w=800&auto=format&fit=crop',
  taxiBlack1:       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?fm=jpg&q=80&w=800&auto=format&fit=crop',
  taxiBlack2:       'https://images.unsplash.com/photo-1568605114967-8130f3a36994?fm=jpg&q=80&w=800&auto=format&fit=crop',
  toyotaPrius:      'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?fm=jpg&q=80&w=800&auto=format&fit=crop',
  toyotaCorolla:    'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?fm=jpg&q=80&w=800&auto=format&fit=crop',
};

export const siteSettings: SiteSettings = {
  siteName: 'Ride Prestige',
  tagline: 'RIDE PRESTIGE',
  heroSubtitle: 'Coach and minibus hire across Sheffield and the UK',
  logoUrl: '/logo.svg',
  faviconUrl: '/favicon.ico',
  brandColor: '#000000',
  accentColor: '#c9a84c',
  contactEmail: 'bookings@rideprestige.co.uk',
  phoneNumber: '+44 114 000 0000',
  address: 'Acquire London College, Sheffield, South Yorkshire, S1 1AB',
  socialLinks: {
    twitter: 'https://twitter.com/rideprestige',
    instagram: 'https://instagram.com/rideprestige',
    linkedin: 'https://linkedin.com/company/rideprestige',
  },
  seoDefaults: {
    title: 'Ride Prestige — Coach & Minibus Hire UK',
    description: 'Coach and minibus hire across Sheffield and the UK. Professional group transport, airport transfers and event travel.',
    ogImage: '/og-image.jpg',
  },
  emailNotifications: true,
  smsNotifications: false,
};

export const pricingConfig: PricingConfig = {
  prestige: { ratePerMile: 4.40, hourlyRate: 70 },
  minibus: { ratePerMile: 4.00, rate16Seater: 420, rate24Seater: 520, rate32Seater: 620 },
  coaches: { ratePerMile: 4.00, hourlyRate: 110 },
  taxi: { ratePerMile: 3.00, minimumFare: 8 },
  driverSearchRadiusMiles: 20,
};

export const cancellationPolicy: CancellationPolicy = {
  minHoursBeforeRide: 8,
  refundWindowHours: 48,
  message: 'Cancellations must be made at least 8 hours before your ride. Refunds processed within 48 hours of approval.',
};

export const fleetCategories: FleetCategory[] = [
  { id: 'cat-3', slug: 'coaches',  name: 'Coaches',           tagline: 'Large group transport',            description: 'Full-size coaches for large groups, corporate events, school trips, and long-distance travel.', icon: 'coach', available: true, order: 1 },
  { id: 'cat-2', slug: 'minibus',  name: 'Minibuses',         tagline: 'Comfortable group travel',         description: 'Modern minibuses ideal for airport transfers, private group journeys, and events.', icon: 'minibus', available: true, order: 2 },
  { id: 'cat-1', slug: 'prestige', name: 'Prestige Vehicles', tagline: 'Luxury travel for every occasion', description: 'Executive cars and luxury vehicles for corporate travel, airport transfers, and VIP journeys.', icon: 'prestige', available: true, order: 3 },
  { id: 'cat-4', slug: 'taxi',     name: 'Taxis',             tagline: 'Reliable local taxi service',      description: 'Standard taxi service for everyday journeys across Sheffield and South Yorkshire.', icon: 'taxi', available: true, order: 4 },
];

export const vehicles: Vehicle[] = [
  // ── PRESTIGE ──────────────────────────────────────────────────────────────
  {
    id: 'v-p1', categorySlug: 'prestige', name: 'Range Rover', badge: 'Most Popular',
    description: 'The pinnacle of British luxury SUVs. Commanding presence, supreme comfort and advanced technology — the perfect choice for executives and VIP transfers.',
    passengers: 4, luggage: '4 large cases',
    features: ['Heated leather seats', 'Panoramic sunroof', 'Climate control', 'Wi-Fi on board', 'Professional chauffeur', 'Meet & greet service'],
    imageUrl: IMG.rangeRover, available: true, priceNote: '',
  },
  {
    id: 'v-p2', categorySlug: 'prestige', name: 'Mercedes Vito Executive',
    description: 'Unparalleled space and luxury for up to 7 passengers. Perfect for corporate group travel, airport transfers, and private events.',
    passengers: 7, luggage: '7 large cases',
    features: ['Leather captain seats', 'Individual climate zones', 'Entertainment screens', 'USB & wireless charging', 'Privacy glass', 'Professional chauffeur'],
    imageUrl: IMG.mercedesVito, available: true, priceNote: '',
  },
  {
    id: 'v-p3', categorySlug: 'prestige', name: 'BMW 5 Series',
    description: 'Athletic performance and executive comfort ideal for business travel. Premium executive saloon combining performance with luxury.',
    passengers: 3, luggage: '3 large cases',
    features: ['Full leather interior', 'Ambient lighting', 'Apple CarPlay', 'Heated seats', 'Professional driver', 'Complimentary water'],
    imageUrl: IMG.bmw5Series, available: true, priceNote: '',
  },
  {
    id: 'v-p4', categorySlug: 'prestige', name: 'Bentley Flying Spur', badge: 'Ultra Luxury',
    description: 'The Bentley Flying Spur is a 4-door luxury saloon delivering breathtaking performance with hand-crafted British opulence. One of the finest grand tourers on the road.',
    passengers: 4, luggage: '3 large cases',
    features: ['Hand-crafted interior', 'Naim audio system', 'Massaging seats', 'Personalised temperature zones', 'Champagne chiller', 'White-glove service'],
    imageUrl: IMG.bentleyFlyingSpur, available: true, priceNote: '',
  },
  {
    id: 'v-p5', categorySlug: 'prestige', name: 'Rolls-Royce Phantom', badge: 'Iconic',
    description: 'The Rolls-Royce Phantom is the flagship model — the pinnacle of ultra-luxury motoring. An extraordinary arrival statement for weddings, galas, VIP events, and the most important occasions.',
    passengers: 4, luggage: '3 cases',
    features: ['Starlight headliner', 'Bespoke Gallery dashboard', 'Spirit of Ecstasy', 'Whisper-quiet cabin', 'Dedicated concierge', 'Red carpet arrival'],
    imageUrl: IMG.rollsRoycePhantom, available: true, priceNote: '',
  },
  {
    id: 'v-p6', categorySlug: 'prestige', name: 'Mercedes S-Class',
    description: 'The Mercedes S-Class combines advanced technology with supreme comfort for the most discerning travellers. Ideal for executive journeys and special occasions.',
    passengers: 3, luggage: '3 large cases',
    features: ['MBUX infotainment', 'Rear-seat entertainment', 'Magic Body Control', 'Heated & ventilated seats', 'Professional chauffeur', 'Airport meet & greet'],
    imageUrl: IMG.mercedesSClass, available: true, priceNote: '',
  },
  {
    id: 'v-p7', categorySlug: 'prestige', name: 'Mercedes E-Class',
    description: 'Elegant, refined, and exceptionally comfortable. The E-Class is the ideal choice for business travel and corporate airport transfers.',
    passengers: 3, luggage: '3 large cases',
    features: ['Leather interior', 'COMAND navigation', 'Heated front seats', 'Climate control', 'Professional driver', 'Complimentary refreshments'],
    imageUrl: IMG.mercedesEClass, available: true, priceNote: '',
  },
  {
    id: 'v-p8', categorySlug: 'prestige', name: 'Bentley Bentayga', badge: 'Flagship SUV',
    description: 'The Bentley Bentayga is a luxury SUV that redefines executive SUV travel — combining Bentley craftsmanship with the versatility and commanding road presence of an SUV.',
    passengers: 5, luggage: '4 large cases',
    features: ['Mulliner craftsmanship', 'Naim for Bentley audio', 'All-terrain capability', 'Massage seats', 'Bentley Connected', 'White-glove chauffeur'],
    imageUrl: IMG.bentleyBentayga, available: true, priceNote: '',
  },

  // ── MINIBUSES ─────────────────────────────────────────────────────────────
  {
    id: 'v-m1', categorySlug: 'minibus', name: '16-Seater Minibus', badge: 'Standard',
    description: 'Reliable 16-seater minibus for airport transfers, team travel, and private group outings. Spacious, clean and coach-style comfortable.',
    passengers: 16, luggage: '16 standard cases',
    features: ['Air conditioning', 'Comfortable seats', 'Large luggage bay', 'USB charging', 'Professional driver', 'Door-to-door service'],
    imageUrl: IMG.minibus1, available: true, priceNote: '',
  },
  {
    id: 'v-m2', categorySlug: 'minibus', name: '24-Seater Minibus', badge: 'Best Value',
    description: 'Large 24-seater minibus ideal for school groups, sports teams, and large family transfers. Comfortable, modern and reliable.',
    passengers: 24, luggage: '24 standard cases',
    features: ['Full air conditioning', 'Reclining seats', 'Large luggage bay', 'USB charging points', 'Professional driver', 'DDA compliant'],
    imageUrl: IMG.minibus2, available: true, priceNote: '',
  },
  {
    id: 'v-m3', categorySlug: 'minibus', name: '32-Seater Minibus', badge: 'Premium',
    description: 'Premium 32-seater minibus for very large groups, corporate outings, and event transfers. High capacity without compromising on comfort.',
    passengers: 32, luggage: '32 standard cases',
    features: ['High-capacity seating', 'Large luggage area', 'Fresh air ventilation', 'USB charging', 'Professional driver', 'Comfortable ride'],
    imageUrl: IMG.minibus3, available: true, priceNote: '',
  },

  // ── COACHES ───────────────────────────────────────────────────────────────
  {
    id: 'v-c1', categorySlug: 'coaches', name: '32-Seater Coach', badge: 'Standard',
    description: 'A modern 32-seater coach for medium-large groups. Ideal for school trips, team travel, and private tours across South Yorkshire.',
    passengers: 32, luggage: 'Large underfloor bay',
    features: ['Air conditioning', 'Reclining seats', 'Underfloor luggage', 'USB charging', 'Onboard toilet', 'PA system'],
    imageUrl: IMG.coach1, available: true, priceNote: '',
  },
  {
    id: 'v-c2', categorySlug: 'coaches', name: '44-Seater Coach', badge: 'Best Value',
    description: 'Spacious 44-seater coach for larger groups, events, and corporate excursions. Comfortable and reliable for longer journeys.',
    passengers: 44, luggage: 'Large underfloor bay',
    features: ['Air conditioning', 'Reclining seats', 'Underfloor luggage', 'Entertainment system', 'Wi-Fi', 'PA system'],
    imageUrl: IMG.coach2, available: true, priceNote: '',
  },
  {
    id: 'v-c3', categorySlug: 'coaches', name: '60-Seater Coach', badge: 'Premium',
    description: 'Premium 60-seater coach for large group travel and event transfers. Excellent comfort and full facilities for extended journeys.',
    passengers: 60, luggage: 'Large underfloor bay',
    features: ['Air conditioning', 'Reclining seats', 'Onboard toilet', 'Entertainment system', 'USB charging', 'PA system'],
    imageUrl: IMG.coach3, available: true, priceNote: '',
  },
  {
    id: 'v-c4', categorySlug: 'coaches', name: '70-Seater Coach', badge: 'Maximum Capacity',
    description: 'Our largest coach for big groups. Maximum capacity for festivals, national tours, large corporate events, and sporting fixtures across the UK.',
    passengers: 70, luggage: 'Massive underfloor capacity',
    features: ['Full air conditioning', 'Reclining seats', 'On-board toilet', 'Entertainment monitors', 'PA system', 'Large luggage bays'],
    imageUrl: IMG.coach4, available: true, priceNote: '',
  },
  {
    id: 'v-c5', categorySlug: 'coaches', name: '50-Seater Coach', badge: 'Extended Range',
    description: 'Flexible 50-seater coach for medium-large groups and longer journeys. Excellent comfort with modern onboard amenities.',
    passengers: 50, luggage: 'Large underfloor bay',
    features: ['Air conditioning', 'Reclining seats', 'Entertainment system', 'USB charging', 'Onboard toilet', 'PA system'],
    imageUrl: IMG.coach5, available: true, priceNote: '',
  },
  {
    id: 'v-c6', categorySlug: 'coaches', name: '56-Seater Coach', badge: 'Executive',
    description: 'Executive 56-seater coach with premium seating and advanced comfort features for large corporate groups and event travel.',
    passengers: 56, luggage: 'Large underfloor bay',
    features: ['Air conditioning', 'Reclining seats', 'Onboard toilet', 'Entertainment system', 'USB charging', 'PA system'],
    imageUrl: IMG.coach6, available: true, priceNote: '',
  },

  // ── TAXIS ─────────────────────────────────────────────────────────────────
  {
    id: 'v-t1', categorySlug: 'taxi', name: 'Toyota Corolla',
    description: 'A reliable and efficient saloon taxi for everyday journeys across Sheffield. Clean, comfortable, and punctual.',
    passengers: 4, luggage: '2 medium cases',
    features: ['Air conditioning', 'GPS navigation', 'Card payments accepted', 'Fully licensed & insured'],
    imageUrl: IMG.toyotaCorolla, available: true, priceNote: '',
  },
  {
    id: 'v-t2', categorySlug: 'taxi', name: 'Toyota Prius (Hybrid)', badge: 'Eco Friendly',
    description: 'Eco-friendly hybrid taxi providing a smooth, quiet, and environmentally conscious ride around Sheffield.',
    passengers: 4, luggage: '2 medium cases',
    features: ['Hybrid — lower emissions', 'Air conditioning', 'GPS navigation', 'Card payments', 'Silent & smooth ride'],
    imageUrl: IMG.toyotaPrius, available: true, priceNote: '',
  },
  {
    id: 'v-t4', categorySlug: 'taxi', name: 'Taxi', badge: 'Family Size',
    description: 'Flexible taxi service for small groups or family travel. Spacious, practical, and comfortable for short and airport journeys.',
    passengers: 6, luggage: '5 medium cases',
    features: ['Flexible seating', 'Air conditioning', 'GPS navigation', 'Card payments', 'Family friendly'],
    imageUrl: IMG.taxiWhite, available: true, priceNote: '',
  },
];

export function getVehiclesByCategory(slug: string): Vehicle[] {
  return vehicles.filter(v => v.categorySlug === slug && v.available);
}

export const navigation: NavigationItem[] = [
  { id: 'nav-1', label: 'Home',       href: '/',          visible: true, order: 1 },
  { id: 'nav-2', label: 'Book',       href: '/book',      visible: true, order: 2 },
  { id: 'nav-3', label: 'Fleet',      href: '/fleet',     visible: true, order: 3 },
  { id: 'nav-4', label: 'Promotions', href: '/promotions',visible: true, order: 4 },
  { id: 'nav-5', label: 'FAQ',        href: '/faq',       visible: true, order: 5 },
  { id: 'nav-6', label: 'Contact',    href: '/contact',   visible: true, order: 6 },
];

export const promotions: Promotion[] = [];

export const faqItems: FAQItem[] = [
  { id: 'faq-1', question: 'How do I book a vehicle?', answer: 'Enter your pickup and drop-off postcodes, select your vehicle type, choose date and time, then click "Get Quote". Review your fare estimate and confirm your booking.', category: 'Booking', order: 1, active: true },
  { id: 'faq-2', question: 'What areas do you cover?', answer: 'We cover Sheffield and all of South Yorkshire as our primary area, with a 20-mile driver search radius from your pickup postcode. We also offer nationwide UK transport for longer journeys.', category: 'Service', order: 1, active: true },
  { id: 'faq-3', question: 'What is your cancellation policy?', answer: 'Cancellations must be made at least 8 hours before your scheduled ride. Refunds are processed within 48 hours of approval.', category: 'Cancellation', order: 1, active: true },
  { id: 'faq-4', question: 'Are your drivers licensed?', answer: 'Yes, all drivers are fully licensed, insured, and DBS-checked. Prestige vehicle chauffeurs hold professional chauffeur licences.', category: 'Service', order: 2, active: true },
  { id: 'faq-5', question: 'Do you offer meet and greet at airports?', answer: 'Yes, our prestige and executive vehicles include a professional meet and greet service at all major UK airports, including Manchester, Leeds Bradford, and East Midlands.', category: 'Service', order: 3, active: true },
  { id: 'faq-6', question: 'How far in advance should I book?', answer: 'For same-day bookings, we recommend at least 2 hours notice. For scheduled bookings, 24-48 hours in advance is ideal. Prestige vehicles and coaches may require longer notice.', category: 'Booking', order: 2, active: true },
];

export const pages: Page[] = [
  { id: 'page-home', slug: 'home', title: 'Homepage', seoTitle: 'Ride Prestige — Coach & Minibus Hire UK', metaDescription: 'Coach and minibus hire across Sheffield and the UK. Reliable transport for groups, events and airport transfers.', ogTitle: 'Ride Prestige', ogDescription: 'Your local transport minutes away.', sections: [] },
];

export const fareSettings = {
  baseFare: 15, ratePerMile: 2.50, ratePerMinute: 0.35,
  surgeMultiplier: 1.0, serviceFee: 3.50, mcPercentage: 15,
  waitingTimeFee: 8, airportFee: 12, minimumFare: 25,
};
