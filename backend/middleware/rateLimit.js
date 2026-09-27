import { rateLimit } from 'express-rate-limit';

const limiter = (options) => rateLimit({
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down' },
  ...options,
});

// Brute-force protection for login and signup.
export const authLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 20, skipSuccessfulRequests: true });

// Every run/submit occupies a compiler slot, so these are keyed by user rather than IP.
export const executionLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.user.userId),
});
