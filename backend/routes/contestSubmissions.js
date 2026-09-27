import express from 'express';
import { createContestSubmission, getContestSubmissions } from '../controllers/contestSubmissions.js';
import authMiddleware from '../middleware/auth.js';
import { executionLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/', authMiddleware, executionLimiter, createContestSubmission);
router.get('/', authMiddleware, getContestSubmissions);

export default router;
