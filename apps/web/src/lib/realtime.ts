'use client';

import { io, type Socket } from 'socket.io-client';
import { getPortalToken } from './api-client';

let driverSocket: Socket | null = null;

export function getDriverSocket(): Socket | null {
  const token = getPortalToken('driver');
  if (!token) return null;
  if (!driverSocket) {
    driverSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
  }
  return driverSocket;
}
