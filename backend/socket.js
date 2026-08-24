import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Room from './models/Room.js';

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(decoded.userId);
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinRoom', async ({ roomId, username }) => {
      try {
        if (typeof roomId !== 'string' || !roomId) return socket.emit('error', 'Invalid room');
        const room = await Room.findOne({ roomId }).lean();
        if (!room) return socket.emit('error', 'Room not found');
        if (!room.users.some((id) => String(id) === socket.userId)) return socket.emit('error', 'You are not authorized to access this room');

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.emit('roomJoined', {
          roomId: room.roomId,
          code: room.code,
          language: room.language,
          input: room.input,
          users: room.users.map((id) => String(id)),
        });
        socket.to(roomId).emit('userJoined', { userId: socket.userId, username: typeof username === 'string' ? username.slice(0, 100) : 'User' });
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', 'Failed to join room');
      }
    });

    socket.on('codeUpdate', async ({ roomId, code, language }) => {
      try {
        if (socket.data.roomId !== roomId || typeof code !== 'string' || code.length > 100_000) return socket.emit('error', 'Unauthorized or invalid code');
        const room = await Room.findOne({ roomId });
        if (!room || !room.users.some((id) => String(id) === socket.userId)) return socket.emit('error', 'Unauthorized');
        room.code = code;
        if (typeof language === 'string' && ['cpp'].includes(language)) room.language = language;
        await room.save();
        io.to(roomId).emit('codeUpdate', { roomId, code: room.code, language: room.language });
      } catch (error) {
        console.error('Code update error:', error);
        socket.emit('error', 'Failed to update code');
      }
    });

    socket.on('inputUpdate', async ({ roomId, input }) => {
      try {
        if (socket.data.roomId !== roomId || typeof input !== 'string' || input.length > 100_000) return socket.emit('error', 'Unauthorized or invalid input');
        const room = await Room.findOne({ roomId });
        if (!room || !room.users.some((id) => String(id) === socket.userId)) return socket.emit('error', 'Unauthorized');
        room.input = input;
        await room.save();
        io.to(roomId).emit('inputUpdate', { roomId, input });
      } catch (error) {
        console.error('Input update error:', error);
        socket.emit('error', 'Failed to update input');
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

export default initSocket;
