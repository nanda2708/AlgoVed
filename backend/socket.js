import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Room from './models/Room.js';

const MAX_TEXT_LENGTH = 100_000;
const PERSIST_DELAY_MS = 1500;

/**
 * Edits are broadcast immediately but written to MongoDB at most once per
 * PERSIST_DELAY_MS per room, so a burst of keystrokes costs a single update.
 */
const createPersister = () => {
  const pending = new Map();

  const flush = async (roomId) => {
    const entry = pending.get(roomId);
    if (!entry) return;
    pending.delete(roomId);
    try {
      await Room.updateOne({ roomId }, { $set: entry.changes });
    } catch (error) {
      console.error(`Failed to persist room ${roomId}:`, error.message);
    }
  };

  const schedule = (roomId, changes) => {
    const entry = pending.get(roomId) || { changes: {}, timer: null };
    Object.assign(entry.changes, changes);
    if (!entry.timer) entry.timer = setTimeout(() => flush(roomId), PERSIST_DELAY_MS);
    pending.set(roomId, entry);
  };

  const flushAll = () => Promise.all([...pending.keys()].map((roomId) => {
    clearTimeout(pending.get(roomId).timer);
    return flush(roomId);
  }));

  return { schedule, flush, flushAll };
};

const initSocket = (server, allowedOrigins) => {
  const io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
    maxHttpBufferSize: 200_000,
    pingTimeout: 60000,
    pingInterval: 25000,
  });
  const persister = createPersister();

  // Tells everyone in a room which members currently have it open.
  const broadcastPresence = async (roomId) => {
    const sockets = await io.in(roomId).fetchSockets();
    io.to(roomId).emit('presence', { roomId, online: [...new Set(sockets.map((s) => s.userId))] });
  };

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
    // Membership is checked once on join; later events are only accepted for that room.
    const inRoom = (roomId) => typeof roomId === 'string' && socket.data.roomId === roomId;

    socket.on('joinRoom', async ({ roomId } = {}) => {
      try {
        if (typeof roomId !== 'string' || !roomId) return socket.emit('error', 'Invalid room');
        await persister.flush(roomId);
        const room = await Room.findOne({ roomId }).populate('users', 'username').lean();
        if (!room) return socket.emit('error', 'Room not found');
        if (!room.users.some((user) => String(user._id) === socket.userId)) return socket.emit('error', 'You are not authorized to access this room');

        const previousRoom = socket.data.roomId;
        if (previousRoom && previousRoom !== roomId) {
          socket.leave(previousRoom);
          broadcastPresence(previousRoom).catch(() => {});
        }
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.emit('roomJoined', {
          roomId: room.roomId,
          code: room.code,
          language: room.language,
          input: room.input,
          members: room.users.map((user) => ({ id: String(user._id), username: user.username })),
        });
        await broadcastPresence(roomId);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', 'Failed to join room');
      }
    });

    socket.on('codeUpdate', ({ roomId, code } = {}) => {
      if (!inRoom(roomId) || typeof code !== 'string' || code.length > MAX_TEXT_LENGTH) return socket.emit('error', 'Invalid code update');
      // The sender already has this text; echoing it back would reset their cursor.
      socket.to(roomId).emit('codeUpdate', { roomId, code, language: 'cpp' });
      persister.schedule(roomId, { code });
    });

    socket.on('inputUpdate', ({ roomId, input } = {}) => {
      if (!inRoom(roomId) || typeof input !== 'string' || input.length > MAX_TEXT_LENGTH) return socket.emit('error', 'Invalid input update');
      socket.to(roomId).emit('inputUpdate', { roomId, input });
      persister.schedule(roomId, { input });
    });

    socket.on('disconnect', () => {
      if (socket.data.roomId) broadcastPresence(socket.data.roomId).catch(() => {});
    });
  });

  return { io, flushPending: persister.flushAll };
};

export default initSocket;
