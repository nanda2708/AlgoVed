import crypto from 'crypto';
import express from 'express';
import dotenv from 'dotenv';
import aiCodeReview from './aiCodeReview.js';
import JobQueue from './queue.js';
import { judge, runOnce } from './judge.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8000;
const COMPILER_API_KEY = process.env.COMPILER_API_KEY;
const MAX_CODE_LENGTH = 100_000;
const MAX_INPUT_LENGTH = 1_000_000;
const MAX_TEST_CASES = 100;

const queue = new JobQueue({
  concurrency: Math.max(1, Number(process.env.MAX_CONCURRENT_RUNS) || 2),
  maxPending: Math.max(1, Number(process.env.MAX_PENDING_RUNS) || 50),
});

app.disable('x-powered-by');
app.use(express.json({ limit: '8mb' }));

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const requireCompilerAuth = (req, res, next) => {
  if (!COMPILER_API_KEY) return res.status(503).json({ error: 'Compiler service authentication is not configured' });
  if (!safeEqual(req.get('x-compiler-key') || '', COMPILER_API_KEY)) return res.status(401).json({ error: 'Unauthorized compiler request' });
  return next();
};

const validateSource = ({ language = 'cpp', code }) => {
  if (language !== 'cpp') return 'Only C++ is supported';
  if (typeof code !== 'string' || !code.trim()) return 'Code is required';
  if (code.length > MAX_CODE_LENGTH) return 'Code is too large';
  return null;
};

const sendError = (res, error) => {
  console.error('Compiler error:', error.message);
  res.status(error.status || 500).json({ error: error.status ? error.message : 'Execution failed' });
};

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'compiler', queue: queue.stats });
});

app.post('/run', requireCompilerAuth, async (req, res) => {
  const body = req.body || {};
  const invalid = validateSource(body);
  if (invalid) return res.status(400).json({ error: invalid });
  if (typeof (body.input ?? '') !== 'string' || (body.input ?? '').length > MAX_INPUT_LENGTH) return res.status(413).json({ error: 'Input is too large' });

  try {
    const result = await queue.push(() => runOnce({ code: body.code, input: body.input ?? '', timeLimitMs: body.timeLimitMs, memoryLimitMb: body.memoryLimitMb }));
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

app.post('/judge', requireCompilerAuth, async (req, res) => {
  const body = req.body || {};
  const invalid = validateSource(body);
  if (invalid) return res.status(400).json({ error: invalid });

  const { testCases } = body;
  if (!Array.isArray(testCases) || testCases.length === 0) return res.status(400).json({ error: 'At least one test case is required' });
  if (testCases.length > MAX_TEST_CASES) return res.status(413).json({ error: 'Too many test cases' });
  if (testCases.some((tc) => typeof tc?.input !== 'string' || typeof tc?.output !== 'string')) {
    return res.status(400).json({ error: 'Every test case needs string input and output' });
  }

  try {
    const result = await queue.push(() => judge({
      code: body.code,
      testCases,
      stopOnFailure: body.stopOnFailure !== false,
      timeLimitMs: body.timeLimitMs,
      memoryLimitMb: body.memoryLimitMb,
    }));
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

app.post('/ai-review', requireCompilerAuth, async (req, res) => {
  const invalid = validateSource(req.body || {});
  if (invalid) return res.status(400).json({ error: invalid });

  try {
    const review = await aiCodeReview(req.body.code);
    return res.json({ review });
  } catch (error) {
    console.error('AI review error:', error.message);
    return res.status(503).json({ error: error.message || 'AI review failed' });
  }
});

app.listen(PORT, () => console.log(`Compiler service listening on port ${PORT}`));
