// Core role types
export type UserRole = 'affiliate' | 'affiliateDriver' | 'independentDriver';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarInitials?: string;
  isApproved: boolean;
  createdAt: string;
}

// ─── Affiliate ───────────────────────────────────────────────────────────────

export interface Affiliate {
  id: string;
  companyName: string;
  tradingName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  operatorLicenceNumber: string;
  companyRegNumber: string;
  vatNumber?: string;
  numberOfVehicles: number;
  numberOfDrivers: number;
  serviceAreas: string[];
  bankAccountName: string;
  sortCode: string;
  accountNumber: string;
  isApproved: boolean;
  rating: number;
  totalJobs: number;
  totalEarnings: number;
}

// ─── Driver ──────────────────────────────────────────────────────────────────

export type DriverStatus = 'available' | 'busy' | 'offline';
export type DriverType = 'affiliateDriver' | 'independentDriver';
export type DocumentStatus = 'approved' | 'pending' | 'rejected' | 'expired' | 'missing';

export interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
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
  assignedVehicleId?: string;
  isApproved: boolean;
  joinedDate: string;
}

// ─── Vehicle ─────────────────────────────────────────────────────────────────

export type VehicleType = 'Saloon' | 'Estate' | 'MPV' | 'Executive' | 'Minibus' | 'Coach' | 'Luxury';
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'offline';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  vehicleType: VehicleType;
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

// ─── Job / Booking ────────────────────────────────────────────────────────────

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
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  stops: Stop[];
  dateTime: string;
  passengerCount: number;
  luggageCount: number;
  vehicleTypeRequested: VehicleType;
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
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

export interface EarningEntry {
  id: string;
  jobId: string;
  bookingRef: string;
  date: string;
  amount: number;
  commissionDeducted: number;
  netAmount: number;
  status: 'paid' | 'pending' | 'processing';
}

export interface EarningsSummary {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalEarnings: number;
  completedJobs: number;
  pendingPayout: number;
  entries: EarningEntry[];
}

// ─── Document ─────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  type: string;
  label: string;
  status: DocumentStatus;
  expiryDate?: string;
  uploadedAt?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'job' | 'system' | 'earnings' | 'document';
  isRead: boolean;
  createdAt: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthContextType {
  user: User | null;
  affiliate: Affiliate | null;
  driver: Driver | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}
