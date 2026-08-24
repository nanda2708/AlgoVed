import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateFile from './generateFile.js';
import generateInputFile from './generateInputFile.js';
import executeCpp from './executeCpp.js';
import aiCodeReview from './aiCodeReview.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8000;
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
const COMPILER_API_KEY = process.env.COMPILER_API_KEY;
const MAX_CONCURRENT_RUNS = Math.max(1, Number(process.env.MAX_CONCURRENT_RUNS) || 2);
let activeRuns = 0;

app.disable('x-powered-by');
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '256kb' }));

const requireCompilerAuth = (req, res, next) => {
  if (!COMPILER_API_KEY) {
    return res.status(503).json({ success: false, error: 'Compiler service authentication is not configured.' });
  }
  if (req.get('x-compiler-key') !== COMPILER_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized compiler request.' });
  }
  return next();
};

app.get('/', (req, res) => {
  res.status(200).json({ online: true, service: 'compiler' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'compiler', activeRuns, maxConcurrentRuns: MAX_CONCURRENT_RUNS });
});

app.post('/run', requireCompilerAuth, async (req, res) => {
  const { language = 'cpp', code, input = '' } = req.body || {};

  if (activeRuns >= MAX_CONCURRENT_RUNS) {
    return res.status(429).json({ success: false, error: 'Compiler is busy. Please retry shortly.' });
  }
  if (language !== 'cpp') {
    return res.status(400).json({ success: false, error: 'Only C++ execution is currently supported.' });
  }
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'Empty code.' });
  }
  if (code.length > 100_000) {
    return res.status(413).json({ success: false, error: 'Code is too large.' });
  }
  if (typeof input !== 'string' || input.length > 100_000) {
    return res.status(413).json({ success: false, error: 'Input is too large.' });
  }

  activeRuns += 1;
  try {
    const filePath = await generateFile(language, code);
    const inputPath = await generateInputFile(input);
    const output = await executeCpp(filePath, inputPath);
    return res.json({ success: true, output: output ?? '' });
  } catch (error) {
    console.error('Compiler execution error:', error.message);
    return res.status(400).json({ success: false, error: error.message || 'Compilation or execution failed.' });
  } finally {
    activeRuns = Math.max(0, activeRuns - 1);
  }
});

app.post('/ai-review', requireCompilerAuth, async (req, res) => {
  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'Empty code.' });
  }
  if (code.length > 100_000) {
    return res.status(413).json({ success: false, error: 'Code is too large.' });
  }

  try {
    const review = await aiCodeReview(code);
    return res.json({ success: true, review });
  } catch (error) {
    console.error('AI review error:', error.message);
    return res.status(503).json({ success: false, error: error.message || 'AI Review Failed' });
  }
});

app.listen(PORT, () => console.log(`Compiler server listening on port ${PORT}`));
