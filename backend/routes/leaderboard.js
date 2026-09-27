import express from 'express';
import { getLeaderboard, getPlatformStats } from '../controllers/leaderboard.js';

// Public, read-only endpoints used by the landing page and leaderboard.
const router = express.Router();
router.get('/', getLeaderboard);
router.get('/stats', getPlatformStats);
export default router;
