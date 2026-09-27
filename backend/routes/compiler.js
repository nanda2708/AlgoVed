import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { executionLimiter } from '../middleware/rateLimit.js';
import { runCode, runSamples, reviewCode } from '../controllers/compiler.js';

const router = express.Router();

router.post('/run', authMiddleware, executionLimiter, runCode);
router.post('/samples', authMiddleware, executionLimiter, runSamples);
router.post('/ai-review', authMiddleware, executionLimiter, reviewCode);

export default router;
