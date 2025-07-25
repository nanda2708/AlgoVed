import express from 'express';
import { createSubmission, getSubmissions } from '../controllers/submission.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createSubmission);
router.get('/', authMiddleware, getSubmissions);

export default router;