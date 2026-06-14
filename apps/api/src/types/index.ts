// ─── Auth / Roles ─────────────────────────────────────────────────────────────

export type PortalRole = 'admin' | 'ops' | 'affiliate' | 'driver' | 'customer';

export interface TokenPayload {
  id: string;
  email: string;
  role: PortalRole;
  affiliateId?: string;
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'super_admin' | 'admin' | 'ops';
  createdAt: string;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  isVerified: boolean;
  totalBookings: number;
  createdAt: string;
}

// ─── Driver ──────────────────────────────────────────────────────────────────

export type DriverStatus   = 'available' | 'busy' | 'offline';
export type DriverType     = 'affiliateDriver' | 'independentDriver';
export type DocumentStatus = 'approved' | 'pending' | 'rejected' | 'expired' | 'missing';

export interface DriverDocument {
  id: string;
  type: string;
  label: string;
  status: DocumentStatus;
  expiryDate?: string;
  uploadedAt?: string;
  rejectionReason?: string;
}

export interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  address: string;
  city: string;
  postcode: string;
  dateOfBirth: string;
  drivingLicenceNumber: string;
  privateHireBadgeNumber: string;
  nationalInsurance?: string;
  driverType: DriverType;
  affiliateId?: string;
  status: DriverStatus;
  rating: number;
  totalJobs: number;
  totalEarnings: number;
  documentsStatus: DocumentStatus;
  documents: DriverDocument[];
  assignedVehicleId?: string;
  isApproved: boolean;
  joinedDate: string;
  latitude?: number;
  longitude?: number;
  lastLocationUpdate?: string;
}

// ─── Affiliate ────────────────────────────────────────────────────────────────

export interface Affiliate {
  id: string;
  companyName: string;
  tradingName: string;
  contactPerson: string;
  email: string;
  phone: string;
  passwordHash: string;
  address: string;
  city: string;
  postcode: string;
  operatorLicenceNumber: string;
  companyRegNumber: string;
  vatNumber?: string;
  serviceAreas: string[];
  bankAccountName: string;
  sortCode: string;
  accountNumber: string;
  isApproved: boolean;
  rating: number;
  totalJobs: number;
  totalEarnings: number;
  createdAt: string;
}

// ─── Operational Fleet Vehicle ────────────────────────────────────────────────

export type VehicleType     = 'Saloon' | 'Estate' | 'MPV' | 'Executive' | 'Minibus' | 'Coach' | 'Luxury';
export type VehicleStatus   = 'available' | 'in_use' | 'maintenance' | 'offline';
export type VehicleCategory = 'prestige' | 'minibus' | 'coaches' | 'taxi';

export interface FleetVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  vehicleType: VehicleType;
  vehicleCategory: VehicleCategory;
  colour: string;
  passengerCapacity: number;
  luggageCapacity: number;
  motExpiry: string;
  insuranceExpiry: string;
  phvLicenceExpiry: string;
  status: VehicleStatus;
  affiliateId?: string;
  assignedDriverId?: string;
}

// ─── Website Fleet (CMS vehicles) ────────────────────────────────────────────

export interface WebsiteVehicle {
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

export interface WebsiteFleetCategory {
  id: string;
  slug: VehicleCategory;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  available: boolean;
  order: number;
}

// ─── Job (internal operational ride) ─────────────────────────────────────────

export type JobStatus =
  | 'awaiting_affiliate'
  | 'accepted_by_affiliate'
  | 'needs_allocation'
  | 'driver_assigned'
  | 'vehicle_assigned'
  | 'driver_accepted'
  | 'on_route'
  | 'arrived_pickup'
  | 'passenger_onboard'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface Stop {
  id: string;
  address: string;
  order: number;
}

export interface Job {
  id: string;
  bookingRef: string;
  bookingId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupAddress: string;
  dropoffAddress: string;
  stops: Stop[];
  dateTime: string;
  passengerCount: number;
  luggageCount: number;
  vehicleTypeRequested: VehicleType;
  vehicleCategory: VehicleCategory;
  fareAmount: number;
  commissionAmount: number;
  affiliatePayoutAmount: number;
  driverPayoutAmount: number;
  distance: string;
  estimatedDuration: string;
  specialInstructions?: string;
  flightNumber?: string;
  trainNumber?: string;
  status: JobStatus;
  affiliateId?: string;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  customerRating?: number;
  driverRating?: number;
}

// ─── Customer Booking (website-originated) ────────────────────────────────────

export type BookingStatus = 'pending' | 'quoted' | 'accepted' | 'in_progress' | 'rejected' | 'completed' | 'cancelled';
export type BookingType   = 'current' | 'scheduled';

export interface Booking {
  id: string;
  reference: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
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
  couponCode?: string;
  discountAmount?: number;
  adminNotes?: string;
  jobId?: string;
}

// ─── Quote ────────────────────────────────────────────────────────────────────

export interface QuoteResult {
  id: string;
  bookingRef: string;
  createdAt: string;
  expiresAt: string;
  journey: {
    pickupPostcode: string;
    dropoffPostcode: string;
    passengers: number;
    vehicleCategory: VehicleCategory;
    bookingType: BookingType;
    date?: string;
    time?: string;
    notes?: string;
  };
  calculation: {
    estimatedDistanceMiles: number;
    estimatedHours: number;
    mileageCharge: number;
    timeCharge: number;
    subtotal: number;
    discount: number;
    total: number;
    breakdown: string;
    note: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

export interface EarningEntry {
  id: string;
  jobId: string;
  bookingRef: string;
  entityId: string;
  entityType: 'affiliate' | 'driver';
  date: string;
  grossAmount: number;
  commissionDeducted: number;
  netAmount: number;
  status: 'paid' | 'pending' | 'processing';
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  recipientId: string;
  recipientRole: PortalRole;
  title: string;
  body: string;
  type: 'job' | 'system' | 'earnings' | 'document' | 'booking';
  isRead: boolean;
  createdAt: string;
}

// ─── Support Ticket ───────────────────────────────────────────────────────────

export interface SupportTicket {
  id: string;
  reference: string;
  type: 'enquiry' | 'complaint' | 'booking_support' | 'other';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
  customer: { name: string; email: string; phone?: string; };
  bookingReference?: string;
  subject: string;
  message: string;
  adminNotes?: string;
  reply?: string;
}

// ─── Pricing & CMS ───────────────────────────────────────────────────────────

export interface PricingConfig {
  prestige: { ratePerMile: number; hourlyRate: number; };
  minibus: { ratePerMile: number; rate16Seater: number; rate24Seater: number; rate32Seater: number; };
  coaches: { ratePerMile: number; hourlyRate: number; };
  taxi: { ratePerMile: number; minimumFare: number; };
  driverSearchRadiusMiles: number;
  commissionPercentage: number;
  driverPayoutPercentage: number;
}

export interface CancellationPolicy {
  minHoursBeforeRide: number;
  refundWindowHours: number;
  message: string;
}

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
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface NavigationItem {
  id: string; label: string; href: string; visible: boolean; order: number;
}

export interface Promotion {
  id: string; title: string; description: string; couponCode?: string;
  discountType: 'percentage' | 'fixed'; discountValue: number;
  startDate: string; endDate: string; active: boolean;
  imageUrl?: string; terms: string; category?: VehicleCategory | 'all';
}

export interface FAQItem {
  id: string; question: string; answer: string;
  category: string; order: number; active: boolean;
}

// ─── Express augmentation ─────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
