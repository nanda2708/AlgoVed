import express from 'express';
import { body } from 'express-validator';
import { login, signup } from '../controllers/auth.js';
import { getMe } from '../controllers/user.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post(
  '/signup',
  authLimiter,
  [
    body('username').isString().trim().matches(/^[A-Za-z0-9_.-]{3,30}$/).withMessage('Username must be 3-30 characters: letters, digits, _ . -'),
    body('email').isString().trim().isEmail().withMessage('Enter a valid email address'),
    body('fullName').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Full name is required'),
    body('password').isString().isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters'),
    body('dob').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date of birth'),
  ],
  signup
);

router.post(
  '/login',
  authLimiter,
  [
    body('username').isString().trim().notEmpty().withMessage('Username or email is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/me', auth, getMe);

export default router;
