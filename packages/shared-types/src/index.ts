// Shared TypeScript types across all Ride Prestige apps.
// Import in any app: import type { ... } from '@ride-prestige/shared-types'

export type PortalRole = 'admin' | 'ops' | 'affiliate' | 'driver' | 'customer';

export type JobStatus =
  | 'pending'
  | 'awaiting_affiliate'
  | 'needs_allocation'
  | 'driver_assigned'
  | 'driver_accepted'
  | 'on_route'
  | 'arrived_pickup'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type VehicleCategory = 'prestige' | 'minibus' | 'coach' | 'taxi';

export type ApprovalStatus = 'pending' | 'approved' | 'suspended';

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
}
