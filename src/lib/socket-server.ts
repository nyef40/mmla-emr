// src/lib/socket-server.ts
import { Server } from 'socket.io';

let io: Server | null = null;

import type { Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';

export function initializeSocketServer(server: HttpServer | HttpsServer) {
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: [appOrigin, 'http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('appointment-update', (data) => {
      // Broadcast to relevant rooms
      socket.to(`appointment-${data.id}`).emit('appointment-updated', data);
      socket.to('admin-room').emit('appointment-updated', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocketServer() {
  if (!io) {
    throw new Error('Socket server not initialized');
  }
  return io;
}