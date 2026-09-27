import express from 'express';
import { getContests, getLeaderboard, joinContest, createContest, displayContest } from '../controllers/contest.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getContests);
router.post('/', authMiddleware, createContest);
router.get('/:id', authMiddleware, displayContest);
router.post('/:id/join', authMiddleware, joinContest);
router.get('/:id/leaderboard', authMiddleware, getLeaderboard);

export default router;
