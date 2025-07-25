import express from 'express';
import { getContests, getLeaderboard, joinContest, createContest, displayContest } from '../controllers/contest.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();


router.post('/create', authMiddleware, createContest);
router.post('/:id/join', authMiddleware, joinContest);
router.get('/:id', authMiddleware, displayContest);
router.get('/', authMiddleware, getContests);
router.get('/:id/leaderboard', authMiddleware, getLeaderboard);

export default router;