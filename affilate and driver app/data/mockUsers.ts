import type { User, Affiliate } from '@/types';

export const MOCK_AFFILIATE_USER: User = {
  id: 'usr_aff_001',
  name: 'Premier Transfers Ltd',
  email: 'ops@premiertransfers.co.uk',
  phone: '+44 114 555 0100',
  role: 'affiliate',
  avatarInitials: 'PT',
  isApproved: true,
  createdAt: '2022-01-10T09:00:00Z',
};

export const MOCK_AFFILIATE_DRIVER_USER: User = {
  id: 'usr_drv_001',
  name: 'Marcus Williams',
  email: 'marcus.williams@email.com',
  phone: '+44 7891 123456',
  role: 'affiliateDriver',
  avatarInitials: 'MW',
  isApproved: true,
  createdAt: '2022-06-01T09:00:00Z',
};

export const MOCK_INDEPENDENT_DRIVER_USER: User = {
  id: 'usr_drv_005',
  name: 'Priya Sharma',
  email: 'priya.sharma@email.com',
  phone: '+44 7891 567890',
  role: 'independentDriver',
  avatarInitials: 'PS',
  isApproved: true,
  createdAt: '2023-08-01T09:00:00Z',
};

export const MOCK_AFFILIATE: Affiliate = {
  id: 'aff_001',
  companyName: 'Premier Transfers Ltd',
  tradingName: 'Premier Transfers',
  contactPerson: 'Alan Barnes',
  email: 'ops@premiertransfers.co.uk',
  phone: '+44 114 555 0100',
  address: '18 Innovation Way',
  city: 'Sheffield',
  postcode: 'S1 2GH',
  operatorLicenceNumber: 'OC/123456/789',
  companyRegNumber: '09876543',
  vatNumber: 'GB123456789',
  numberOfVehicles: 5,
  numberOfDrivers: 4,
  serviceAreas: ['Sheffield', 'Rotherham', 'Doncaster', 'Manchester', 'Leeds'],
  bankAccountName: 'Premier Transfers Ltd',
  sortCode: '20-45-67',
  accountNumber: '12345678',
  isApproved: true,
  rating: 4.8,
  totalJobs: 412,
  totalEarnings: 48300.00,
};

// Demo login credentials for testing
export const DEMO_LOGINS = [
  {
    email: 'ops@premiertransfers.co.uk',
    password: 'demo1234',
    role: 'affiliate' as const,
    label: 'Demo Affiliate Login',
  },
  {
    email: 'marcus.williams@email.com',
    password: 'demo1234',
    role: 'affiliateDriver' as const,
    label: 'Demo Affiliate Driver Login',
  },
  {
    email: 'priya.sharma@email.com',
    password: 'demo1234',
    role: 'independentDriver' as const,
    label: 'Demo Independent Driver Login',
  },
];
