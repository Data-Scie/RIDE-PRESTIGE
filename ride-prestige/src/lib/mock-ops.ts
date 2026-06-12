export type RideStatus = 'pending' | 'dispatched' | 'accepted' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
export type DriverStatus = 'online' | 'offline' | 'on_ride';
export type ApprovalStatus = 'pending' | 'approved' | 'suspended';

export interface Location { lat: number; lng: number; }

export interface MockRide {
  id: string; ref: string; status: RideStatus;
  customer: { name: string; phone: string; email: string; };
  pickup: { address: string; postcode: string; location: Location; };
  dropoff: { address: string; postcode: string; location: Location; };
  passengers: number; category: string; estimatedFare: number; estimatedMiles: number;
  assignedTo: { type: 'affiliate' | 'independent' | null; name: string; driverName?: string; } | null;
  driverLocation?: Location;
  createdAt: string; acceptedAt?: string; completedAt?: string;
}

export interface MockDriver {
  id: string; name: string; email: string; phone: string; avatar: string;
  licenseNo: string; vehicleModel: string; vehicleReg: string; vehicleColor: string;
  status: DriverStatus; approvalStatus: ApprovalStatus;
  location: Location; rating: number; totalRides: number; earningsToday: number;
  joinedAt: string; documents: { license: boolean; insurance: boolean; dbs: boolean; };
}

export interface MockAffiliate {
  id: string; companyName: string; contactName: string; email: string; phone: string;
  address: string; regNumber: string; approvalStatus: ApprovalStatus;
  driverCount: number; vehicleCount: number; activeRides: number;
  totalRides: number; rating: number; joinedAt: string;
  drivers: { id: string; name: string; status: DriverStatus; vehicleReg: string; location: Location; }[];
  vehicles: { id: string; model: string; reg: string; color: string; seats: number; available: boolean; }[];
}

export const mockRides: MockRide[] = [
  { id: 'r-001', ref: 'RP-2026-3001', status: 'in_progress', customer: { name: 'James Hartley', phone: '+44 7700 900100', email: 'james@example.com' }, pickup: { address: '15 Division Street', postcode: 'S1 4GF', location: { lat: 53.3811, lng: -1.4701 } }, dropoff: { address: 'Sheffield Station', postcode: 'S1 2BP', location: { lat: 53.3780, lng: -1.4622 } }, passengers: 2, category: 'prestige', estimatedFare: 28, estimatedMiles: 3.2, assignedTo: { type: 'affiliate', name: 'Sheffield Premier Cars', driverName: 'Mohammed Ali' }, driverLocation: { lat: 53.3798, lng: -1.4665 }, createdAt: '2026-06-02T10:15:00Z', acceptedAt: '2026-06-02T10:17:00Z' },
  { id: 'r-002', ref: 'RP-2026-3002', status: 'en_route', customer: { name: 'Sarah Patel', phone: '+44 7700 900200', email: 'sarah@example.com' }, pickup: { address: 'Meadowhall Shopping Centre', postcode: 'S9 1EP', location: { lat: 53.4139, lng: -1.4126 } }, dropoff: { address: 'Manchester Airport', postcode: 'M90 1QX', location: { lat: 53.3588, lng: -2.2727 } }, passengers: 3, category: 'prestige', estimatedFare: 145, estimatedMiles: 38, assignedTo: { type: 'independent', name: 'David Chen', driverName: 'David Chen' }, driverLocation: { lat: 53.4100, lng: -1.4200 }, createdAt: '2026-06-02T09:45:00Z', acceptedAt: '2026-06-02T09:48:00Z' },
  { id: 'r-003', ref: 'RP-2026-3003', status: 'pending', customer: { name: 'Emma Wilson', phone: '+44 7700 900300', email: 'emma@example.com' }, pickup: { address: 'Sheffield City Hall', postcode: 'S1 2JA', location: { lat: 53.3810, lng: -1.4759 } }, dropoff: { address: 'Leeds Bradford Airport', postcode: 'LS19 7TU', location: { lat: 53.8659, lng: -1.6606 } }, passengers: 4, category: 'minibus', estimatedFare: 95, estimatedMiles: 28, assignedTo: null, createdAt: '2026-06-02T10:30:00Z' },
  { id: 'r-004', ref: 'RP-2026-3004', status: 'completed', customer: { name: 'Thomas Brown', phone: '+44 7700 900400', email: 'tom@example.com' }, pickup: { address: 'University of Sheffield', postcode: 'S10 2TN', location: { lat: 53.3810, lng: -1.4879 } }, dropoff: { address: 'Sheffield Arena', postcode: 'S9 2DF', location: { lat: 53.4002, lng: -1.4317 } }, passengers: 1, category: 'taxi', estimatedFare: 14, estimatedMiles: 4.1, assignedTo: { type: 'independent', name: 'Raj Kumar', driverName: 'Raj Kumar' }, createdAt: '2026-06-02T08:00:00Z', acceptedAt: '2026-06-02T08:02:00Z', completedAt: '2026-06-02T08:24:00Z' },
  { id: 'r-005', ref: 'RP-2026-3005', status: 'dispatched', customer: { name: 'Olivia Clarke', phone: '+44 7700 900500', email: 'olivia@example.com' }, pickup: { address: 'Endcliffe Park', postcode: 'S11 7AB', location: { lat: 53.3698, lng: -1.4975 } }, dropoff: { address: 'Hillsborough Stadium', postcode: 'S6 1SW', location: { lat: 53.4114, lng: -1.5009 } }, passengers: 6, category: 'minibus', estimatedFare: 42, estimatedMiles: 6.8, assignedTo: { type: 'affiliate', name: 'Yorkshire Minibus Co.', driverName: 'Ahmed Hassan' }, driverLocation: { lat: 53.3750, lng: -1.4900 }, createdAt: '2026-06-02T10:28:00Z', acceptedAt: '2026-06-02T10:29:00Z' },
];

export const mockDrivers: MockDriver[] = [
  { id: 'd-001', name: 'David Chen', email: 'david@example.com', phone: '+44 7700 910100', avatar: 'DC', licenseNo: 'CHENX901208DC9RX', vehicleModel: 'Toyota Corolla', vehicleReg: 'SH21 DCX', vehicleColor: 'White', status: 'on_ride', approvalStatus: 'approved', location: { lat: 53.4100, lng: -1.4200 }, rating: 4.8, totalRides: 312, earningsToday: 145, joinedAt: '2025-11-15', documents: { license: true, insurance: true, dbs: true } },
  { id: 'd-002', name: 'Raj Kumar', email: 'raj@example.com', phone: '+44 7700 910200', avatar: 'RK', licenseNo: 'KUMARR891204RK8TX', vehicleModel: 'Toyota Prius', vehicleReg: 'SH19 RKX', vehicleColor: 'Silver', status: 'online', approvalStatus: 'approved', location: { lat: 53.3850, lng: -1.4700 }, rating: 4.9, totalRides: 541, earningsToday: 88, joinedAt: '2025-08-20', documents: { license: true, insurance: true, dbs: true } },
  { id: 'd-003', name: 'Marcus Johnson', email: 'marcus@example.com', phone: '+44 7700 910300', avatar: 'MJ', licenseNo: 'JOHSM921108MJ5WX', vehicleModel: 'Ford Galaxy', vehicleReg: 'SH22 MJX', vehicleColor: 'Black', status: 'offline', approvalStatus: 'approved', location: { lat: 53.3700, lng: -1.5000 }, rating: 4.7, totalRides: 198, earningsToday: 0, joinedAt: '2026-01-10', documents: { license: true, insurance: true, dbs: true } },
  { id: 'd-004', name: 'Amara Osei', email: 'amara@example.com', phone: '+44 7700 910400', avatar: 'AO', licenseNo: 'OSEIA001215AO2KX', vehicleModel: 'Kia Carnival', vehicleReg: 'SH23 AOX', vehicleColor: 'White', status: 'online', approvalStatus: 'pending', location: { lat: 53.3900, lng: -1.4600 }, rating: 0, totalRides: 0, earningsToday: 0, joinedAt: '2026-05-28', documents: { license: true, insurance: false, dbs: false } },
  { id: 'd-005', name: 'Paul Nowak', email: 'paul@example.com', phone: '+44 7700 910500', avatar: 'PN', licenseNo: 'NOWAKP951120PN4LX', vehicleModel: 'Toyota Corolla', vehicleReg: 'SH20 PNX', vehicleColor: 'Grey', status: 'online', approvalStatus: 'approved', location: { lat: 53.3650, lng: -1.4550 }, rating: 4.6, totalRides: 87, earningsToday: 62, joinedAt: '2026-03-05', documents: { license: true, insurance: true, dbs: true } },
];

export const mockAffiliates: MockAffiliate[] = [
  {
    id: 'a-001', companyName: 'Sheffield Premier Cars', contactName: 'Hassan Al-Rashid', email: 'info@sheffieldpremier.co.uk', phone: '+44 114 200 1000', address: '12 Savile Street, Sheffield S4 7UD', regNumber: '12345678', approvalStatus: 'approved', driverCount: 8, vehicleCount: 6, activeRides: 2, totalRides: 1248, rating: 4.8, joinedAt: '2025-06-01',
    drivers: [
      { id: 'ad-001', name: 'Mohammed Ali', status: 'on_ride', vehicleReg: 'SH71 MAL', location: { lat: 53.3798, lng: -1.4665 } },
      { id: 'ad-002', name: 'Imran Hussain', status: 'online', vehicleReg: 'SH20 IHU', location: { lat: 53.3850, lng: -1.4800 } },
      { id: 'ad-003', name: 'Tariq Mahmood', status: 'offline', vehicleReg: 'SH19 TMH', location: { lat: 53.3750, lng: -1.4900 } },
    ],
    vehicles: [
      { id: 'av-001', model: 'Mercedes E-Class', reg: 'SH71 MAL', color: 'Black', seats: 3, available: false },
      { id: 'av-002', model: 'BMW 5 Series', reg: 'SH20 IHU', color: 'White', seats: 3, available: true },
      { id: 'av-003', model: 'Range Rover', reg: 'SH19 TMH', color: 'Silver', seats: 4, available: true },
    ],
  },
  {
    id: 'a-002', companyName: 'Yorkshire Minibus Co.', contactName: 'Sandra Booth', email: 'bookings@yorkshireminibus.co.uk', phone: '+44 114 300 2000', address: '45 Attercliffe Road, Sheffield S9 3QB', regNumber: '87654321', approvalStatus: 'approved', driverCount: 5, vehicleCount: 4, activeRides: 1, totalRides: 567, rating: 4.6, joinedAt: '2025-09-15',
    drivers: [
      { id: 'ad-004', name: 'Ahmed Hassan', status: 'on_ride', vehicleReg: 'SH22 AHN', location: { lat: 53.3750, lng: -1.4900 } },
      { id: 'ad-005', name: 'Colin Barnes', status: 'online', vehicleReg: 'SH21 CBN', location: { lat: 53.4000, lng: -1.4400 } },
    ],
    vehicles: [
      { id: 'av-004', model: '16-Seat Minibus', reg: 'SH22 AHN', color: 'White', seats: 16, available: false },
      { id: 'av-005', model: '24-Seat Minibus', reg: 'SH21 CBN', color: 'White', seats: 24, available: true },
    ],
  },
  {
    id: 'a-003', companyName: 'Peak District Coaches', contactName: 'Robert Mills', email: 'info@peakcoaches.co.uk', phone: '+44 114 400 3000', address: '88 London Road, Sheffield S2 4LH', regNumber: '11223344', approvalStatus: 'pending', driverCount: 0, vehicleCount: 0, activeRides: 0, totalRides: 0, rating: 0, joinedAt: '2026-05-30',
    drivers: [], vehicles: [],
  },
];

export const mockStats = {
  activeRides: 3, pendingRides: 1, completedToday: 28, cancelledToday: 2,
  onlineDrivers: 12, onlineAffiliateDrivers: 8, revenueToday: 1842, avgRating: 4.76,
  totalAffiliates: 3, approvedAffiliates: 2, pendingAffiliates: 1,
  totalDrivers: 5, approvedDrivers: 4, pendingDrivers: 1,
};
