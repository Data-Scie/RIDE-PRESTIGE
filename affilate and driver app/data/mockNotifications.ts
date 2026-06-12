import type { Notification } from '@/types';

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_001',
    title: 'New Job Available',
    body: 'RP-2024-0891: Manchester Airport → Deansgate. £85.00. Awaiting your acceptance.',
    type: 'job',
    isRead: false,
    createdAt: '2024-12-14T10:00:00Z',
  },
  {
    id: 'notif_002',
    title: 'New Job Available',
    body: 'RP-2024-0892: Sheffield Station → Meadowhall. £32.00. Awaiting your acceptance.',
    type: 'job',
    isRead: false,
    createdAt: '2024-12-14T11:30:00Z',
  },
  {
    id: 'notif_003',
    title: 'Job Assigned',
    body: 'You have been assigned to job RP-2024-0894. Heathrow T5 → The Ritz. 17 Dec, 11:00.',
    type: 'job',
    isRead: true,
    createdAt: '2024-12-14T14:00:00Z',
  },
  {
    id: 'notif_004',
    title: 'Payment Processed',
    body: 'Payment of £99.00 for job RP-2024-0896 has been processed.',
    type: 'earnings',
    isRead: false,
    createdAt: '2024-12-18T16:30:00Z',
  },
  {
    id: 'notif_005',
    title: 'Document Expiring Soon',
    body: 'Vehicle GK19 PTW MOT expires on 30 Nov 2024. Please renew immediately.',
    type: 'document',
    isRead: false,
    createdAt: '2024-12-10T09:00:00Z',
  },
  {
    id: 'notif_006',
    title: 'Account Approved',
    body: 'Your Ride Prestige affiliate account has been approved. Welcome aboard!',
    type: 'system',
    isRead: true,
    createdAt: '2022-01-10T10:00:00Z',
  },
];
