import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { runCode, reviewCode } from '../controllers/compiler.js';

const router = express.Router();

router.post('/run', authMiddleware, runCode);
router.post('/ai-review', authMiddleware, reviewCode);

export default router;
