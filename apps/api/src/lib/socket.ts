import { Server } from 'socket.io';
import { verifyToken } from '../middleware/auth';

let _io: Server | null = null;

export function initIO(server: import('http').Server): Server {
  _io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  _io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') return next(new Error('Unauthorized'));
    try {
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  _io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    const user = socket.data.user;
    socket.join(`${user.role}:${user.id}`);
    if (user.role === 'ops') socket.join('ops');
    if (user.role === 'admin') socket.join('admin');

    socket.on('driver:location', (payload: { jobId?: string; lat: number; lng: number; speed?: number; heading?: number }) => {
      if (user.role !== 'driver') return;
      const securedPayload = { ...payload, driverId: user.id };
      _io?.to('ops').emit('driver:location', securedPayload);
      if (payload.jobId) {
        _io?.to(`job:${payload.jobId}`).emit('driver:location', securedPayload);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return _io;
}

export function getIO(): Server | null {
  return _io;
}

export function emitToRoom(room: string, event: string, data: unknown): void {
  _io?.to(room).emit(event, data);
}

export function broadcastJobUpdate(jobId: string, event: string, data: unknown): void {
  _io?.to(`job:${jobId}`).emit(event, data);
  _io?.to('ops').emit(event, data);
  _io?.to('admin').emit(event, data);
}
