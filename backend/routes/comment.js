import express from 'express';
import { createComment, getComments } from '../controllers/comment.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createComment);
router.get('/', authMiddleware, getComments);

export default router;