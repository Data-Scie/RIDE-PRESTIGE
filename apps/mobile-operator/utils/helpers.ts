import type { JobStatus, DocumentStatus, VehicleStatus, DriverStatus } from '@/types';

export function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function jobStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    awaiting_affiliate: 'Awaiting Acceptance',
    accepted_by_affiliate: 'Accepted',
    needs_allocation: 'Needs Allocation',
    driver_assigned: 'Driver Assigned',
    vehicle_assigned: 'Driver & Vehicle Assigned',
    driver_accepted: 'Driver Confirmed',
    on_route: 'On Route',
    arrived_pickup: 'Arrived at Pickup',
    passenger_onboard: 'Passenger On Board',
    in_progress: 'Ride In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return labels[status] ?? status;
}

export function jobStatusColor(status: JobStatus): string {
  switch (status) {
    case 'awaiting_affiliate': return '#FF9800';
    case 'needs_allocation': return '#FF9800';
    case 'driver_assigned': return '#2196F3';
    case 'vehicle_assigned': return '#2196F3';
    case 'driver_accepted': return '#9C27B0';
    case 'on_route': return '#D7B46A';
    case 'arrived_pickup': return '#D7B46A';
    case 'passenger_onboard': return '#D7B46A';
    case 'in_progress': return '#D7B46A';
    case 'completed': return '#4CAF50';
    case 'cancelled': return '#E53935';
    case 'rejected': return '#E53935';
    default: return '#B8B0A4';
  }
}

export function documentStatusColor(status: DocumentStatus): string {
  switch (status) {
    case 'approved': return '#4CAF50';
    case 'pending': return '#FF9800';
    case 'rejected': return '#E53935';
    case 'expired': return '#E53935';
    case 'missing': return '#B8B0A4';
    default: return '#B8B0A4';
  }
}

export function vehicleStatusColor(status: VehicleStatus): string {
  switch (status) {
    case 'available': return '#4CAF50';
    case 'in_use': return '#2196F3';
    case 'maintenance': return '#FF9800';
    case 'offline': return '#B8B0A4';
    default: return '#B8B0A4';
  }
}

export function driverStatusColor(status: DriverStatus): string {
  switch (status) {
    case 'available': return '#4CAF50';
    case 'busy': return '#FF9800';
    case 'offline': return '#B8B0A4';
    default: return '#B8B0A4';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
