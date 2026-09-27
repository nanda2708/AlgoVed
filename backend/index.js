import { createServer } from 'http';
import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import initSocket from './socket.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import problemRoutes from './routes/problem.js';
import commentRoutes from './routes/comment.js';
import submissionRoutes from './routes/submission.js';
import compilerRoutes from './routes/compiler.js';
import contestRoutes from './routes/contest.js';
import contestSubmissionRoutes from './routes/contestSubmissions.js';
import codingRoomRoutes from './routes/codingRooms.js';
import leaderboardRoutes from './routes/leaderboard.js';

dotenv.config();

for (const name of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`${name} is not set. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

export const allowedOrigins = (process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const app = express();
const server = createServer(app);

// Behind nginx in production; needed so rate limiting sees the client IP.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

const health = (req, res) => res.json({ status: 'OK', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
app.get('/health', health);
app.get('/api/health', health);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/compiler', compilerRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/contest-submissions', contestSubmissionRoutes);
app.use('/api/coding-room', codingRoomRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large' });
  console.error('Unhandled request error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
let realtime = null;

const start = async () => {
  try {
    await connectDB();
    realtime = initSocket(server, allowedOrigins);
    server.once('error', (error) => {
      console.error(error.code === 'EADDRINUSE' ? `Port ${PORT} is already in use` : `Server error: ${error.message}`);
      process.exit(1);
    });
    server.listen(PORT, () => console.log(`API listening on port ${PORT}`));
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down`);
  setTimeout(() => process.exit(1), 10_000).unref();
  // Unsaved room edits are written before the database connection closes.
  await realtime?.flushPending();
  realtime?.io.close();
  server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
