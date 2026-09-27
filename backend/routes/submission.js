import express from 'express';
import { createSubmission, getSubmissions } from '../controllers/submission.js';
import authMiddleware from '../middleware/auth.js';
import { executionLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/', authMiddleware, executionLimiter, createSubmission);
router.get('/', authMiddleware, getSubmissions);

export default router;
