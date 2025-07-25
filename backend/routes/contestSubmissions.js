import express from 'express';
import { createContestSubmission, getContestSubmissions, getContestLeaderboard } from '../controllers/contestSubmissions.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createContestSubmission);
router.get('/', authMiddleware, getContestSubmissions);
router.get('/leaderboard/:id', authMiddleware, getContestLeaderboard);

export default router;