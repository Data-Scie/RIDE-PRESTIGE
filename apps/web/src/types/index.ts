export type VehicleCategory = 'prestige' | 'minibus' | 'coaches' | 'taxi';
export type BookingStatus = 'pending' | 'quoted' | 'accepted' | 'in_progress' | 'rejected' | 'completed' | 'cancelled';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';
export type BookingType = 'current' | 'scheduled';

export interface Vehicle {
  id: string;
  categorySlug: VehicleCategory;
  name: string;
  description: string;
  passengers: number;
  luggage?: string;
  features: string[];
  imageUrl: string;
  available: boolean;
  priceNote?: string;
  badge?: string;
}

export interface FleetCategory {
  id: string;
  slug: VehicleCategory;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  available: boolean;
  order: number;
}

export interface PricingConfig {
  prestige: { ratePerMile: number; hourlyRate: number; };
  minibus: { ratePerMile: number; rate16Seater: number; rate24Seater: number; rate32Seater: number; };
  coaches: { ratePerMile: number; hourlyRate: number; };
  taxi: { ratePerMile: number; minimumFare: number; };
  driverSearchRadiusMiles: number;
}

export interface CancellationPolicy {
  minHoursBeforeRide: number;
  refundWindowHours: number;
  message: string;
}

export interface BookingFormData {
  fullName?: string;
  phone?: string;
  email?: string;
  pickupPostcode: string;
  dropoffPostcode: string;
  bookingType: BookingType;
  date?: string;
  time?: string;
  passengers: number;
  notes?: string;
  vehicleCategory: VehicleCategory;
  vehicleId?: string;
}

export interface Booking {
  id: string;
  reference: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  customer: { fullName: string; phone: string; email: string; };
  journey: {
    pickupPostcode: string;
    dropoffPostcode: string;
    bookingType: BookingType;
    date?: string;
    time?: string;
    passengers: number;
    notes?: string;
  };
  vehicleCategory: VehicleCategory;
  vehicleId?: string;
  estimatedMiles?: number;
  estimatedFare?: number;
  adminNotes?: string;
}

export interface QuoteResult {
  id: string;
  bookingRef: string;
  createdAt: string;
  journey: {
    pickupPostcode: string;
    dropoffPostcode: string;
    passengers: number;
    vehicleCategory: VehicleCategory;
    vehicleId?: string;
    date?: string;
    time?: string;
    bookingType: BookingType;
  };
  calculation: {
    estimatedDistanceMiles: number;
    estimatedHours: number;
    mileageCharge: number;
    timeCharge: number;
    total: number;
    breakdown: string;
    note: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
}

export interface FareSettings {
  baseFare: number;
  ratePerMile: number;
  ratePerMinute: number;
  surgeMultiplier: number;
  serviceFee: number;
  mcPercentage: number;
  waitingTimeFee: number;
  airportFee: number;
  minimumFare: number;
}

export interface SupportTicket {
  id: string;
  reference: string;
  type: 'enquiry' | 'complaint' | 'booking_support' | 'other';
  status: TicketStatus;
  createdAt: string;
  customer: { name: string; email: string; phone?: string; };
  bookingReference?: string;
  subject: string;
  message: string;
  adminNotes?: string;
}

export interface NavigationItem { id: string; label: string; href: string; visible: boolean; order: number; }

export interface Promotion {
  id: string; title: string; description: string; couponCode?: string;
  discountType: 'percentage' | 'fixed'; discountValue: number;
  startDate: string; endDate: string; active: boolean;
  imageUrl?: string; terms: string; category?: VehicleCategory | 'all';
}

export interface FAQItem { id: string; question: string; answer: string; category: string; order: number; active: boolean; }

export interface PageSection { id: string; type: string; visible: boolean; order: number; content: Record<string, unknown>; }
export interface Page { id: string; slug: string; title: string; seoTitle: string; metaDescription: string; ogTitle: string; ogDescription: string; sections: PageSection[]; }

export interface SiteSettings {
  siteName: string;
  tagline: string;
  heroSubtitle: string;
  logoUrl: string;
  faviconUrl: string;
  brandColor: string;
  accentColor: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  socialLinks: { twitter?: string; instagram?: string; linkedin?: string; facebook?: string; };
  seoDefaults: { title: string; description: string; ogImage: string; };
  googleMapsApiKey?: string;
  stripePublicKey?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface AdminUser { id: string; email: string; role: 'super_admin' | 'admin' | 'support'; createdAt: string; }
