import express from 'express';
import auth from '../middleware/auth.js';
import { getMe, getMyStats } from '../controllers/user.js';

const router = express.Router();

router.get('/me', auth, getMe);
router.get('/me/stats', auth, getMyStats);

export default router;
