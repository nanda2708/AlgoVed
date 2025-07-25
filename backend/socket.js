import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Room from './models/Room.js';

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000",
      methods: ['GET', 'POST'],
      credentials: true, // important for auth
    },
    transports: ['websocket', 'polling'], // include both
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      console.log('User connected:', socket.id, 'userId:', socket.userId);
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinRoom', async ({ roomId, userId, username }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }
        if (!room.users.includes(userId)) {
          socket.emit('error', 'You are not authorized to access this room');
          return;
        }
        socket.join(roomId);
        console.log('User joined room:', { roomId, userId, username });
        socket.emit('roomJoined', {
          roomId: room.roomId,
          code: room.code,
          language: room.language,
          input: room.input,
          users: room.users.map(id => id.toString()),
        });
        socket.to(roomId).emit('userJoined', { userId, username });
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', 'Failed to join room');
      }
    });

    socket.on('codeUpdate', async ({ roomId, code, language }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room || !room.users.includes(socket.userId)) {
          socket.emit('error', 'Unauthorized');
          return;
        }
        room.code = code;
        room.language = language;
        await room.save();
        console.log('Code updated in room:', roomId, 'by user:', socket.userId);
        io.to(roomId).emit('codeUpdate', { roomId, code, language });
      } catch (error) {
        console.error('Code update error:', error);
        socket.emit('error', 'Failed to update code');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('User disconnected:', socket.id, 'reason:', reason);
    });
  });

  return io;
};

export default initSocket;
