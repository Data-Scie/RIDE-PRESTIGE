'use client';

import { io, type Socket } from 'socket.io-client';
import { getPortalToken } from './api-client';

type PortalRole = 'admin' | 'ops' | 'affiliate' | 'driver' | 'customer';

const sockets: Partial<Record<PortalRole, Socket>> = {};

export function getPortalSocket(role: PortalRole): Socket | null {
  const token = getPortalToken(role);
  if (!token) return null;
  const existing = sockets[role];
  if (existing) return existing;
  const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
  });
  sockets[role] = socket;
  return socket;
}

export function getDriverSocket(): Socket | null {
  return getPortalSocket('driver');
}
