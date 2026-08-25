import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import problemRoutes from './routes/problem.js';
import commentRoutes from './routes/comment.js';
import submissionRoutes from './routes/submission.js';
import compilerRoutes from './routes/compiler.js';
import contestRoutes from './routes/contest.js';
import leaderboardRoutes from './routes/leaderboard.js';
import initSocket from './socket.js';
import { createServer } from 'http';
import contestSubmissionRoutes from './routes/contestSubmissions.js';
import codingRoomRoutes from './routes/codingRooms.js';
import morgan from 'morgan';

dotenv.config();
const app = express();
const server = createServer(app);
app.disable('x-powered-by');
app.use(helmet());
const allowedOrigins = (process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000').split(',').map((value) => value.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/compiler', compilerRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/contest-submissions', contestSubmissionRoutes);
app.use('/api/coding-room', codingRoomRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/health', (req, res) => res.status(200).json({ status: 'OK', message: 'Backend is running' }));
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled request error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
const startServer = async () => {
  try {
    await connectDB();
    initSocket(server);
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Backend startup failed:', error.message);
    process.exit(1);
  }
};
startServer();
