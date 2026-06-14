import { Server } from 'socket.io';

let _io: Server | null = null;

export function initIO(server: import('http').Server): Server {
  _io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  _io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join-room', (room: string) => {
      socket.join(room);
    });

    socket.on('driver:location', (payload: { driverId: string; jobId?: string; lat: number; lng: number; speed?: number; heading?: number }) => {
      _io?.to('ops').emit('driver:location', payload);
      if (payload.jobId) {
        _io?.to(`job:${payload.jobId}`).emit('driver:location', payload);
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
