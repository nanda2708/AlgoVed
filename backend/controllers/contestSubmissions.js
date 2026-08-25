import axios from 'axios';
import mongoose from 'mongoose';
import ContestSubmission from '../models/ContestSubmission.js';
import Problem from '../models/Problem.js';
import Contest from '../models/Contest.js';
import { v4 as uuidv4 } from 'uuid';

const MAX_CODE_LENGTH = 100_000;
const normalizeOutput = (value) => String(value ?? '').replace(/\r\n/g, '\n').trim();
const publicResults = (results = []) => results.map(({ input, expected, actual, passed, hidden, status }) => hidden ? { passed, status } : { input, expected, actual, passed, status });

const runCompiler = async (payload) => {
  const baseUrl = process.env.COMPILER_API_URL?.replace(/\/$/, '');
  const key = process.env.COMPILER_API_KEY;
  if (!baseUrl || !key) {
    const error = new Error('Compiler service is not configured');
    error.status = 503;
    throw error;
  }
  return axios.post(`${baseUrl}/run`, payload, {
    headers: { 'x-compiler-key': key },
    timeout: 15_000,
    maxContentLength: 1_000_000,
    maxBodyLength: 1_000_000,
  });
};

export const createContestSubmission = async (req, res) => {
  const { problemId, contestId, code, language } = req.body || {};
  try {
    if (!mongoose.isValidObjectId(problemId) || !mongoose.isValidObjectId(contestId)) return res.status(400).json({ message: 'Invalid problem or contest ID' });
    if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ message: 'Code is required' });
    if (code.length > MAX_CODE_LENGTH) return res.status(413).json({ message: 'Code is too large' });
    if (language !== 'cpp') return res.status(400).json({ message: 'Only C++ submissions are currently supported' });

    const [contest, problem] = await Promise.all([Contest.findById(contestId).lean(), Problem.findById(problemId).lean()]);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    if (!contest.problems.some((id) => String(id) === String(problemId))) return res.status(400).json({ message: 'Problem is not part of this contest' });

    const now = Date.now();
    if (now < new Date(contest.startTime).getTime() || now > new Date(contest.endTime).getTime()) return res.status(400).json({ message: 'Contest is not active' });
    if (!contest.participants.some((id) => String(id) === String(req.user.userId))) return res.status(403).json({ message: 'Join the contest before submitting' });

    const results = [];
    for (const tc of problem.testCases || []) {
      try {
        const response = await runCompiler({ language, code, input: tc.input });
        const actual = response.data?.output ?? '';
        const passed = normalizeOutput(actual) === normalizeOutput(tc.output);
        results.push({ input: tc.input, expected: tc.output, actual, passed, hidden: Boolean(tc.hidden), status: passed ? 'Accepted' : 'Wrong Answer' });
      } catch (err) {
        results.push({ input: tc.input, expected: tc.output, actual: err.response?.data?.error || err.message, passed: false, hidden: Boolean(tc.hidden), status: 'Error' });
      }
      if (!results[results.length - 1].passed) break;
    }

    const passedAll = results.length === problem.testCases.length && results.every((r) => r.passed);
    const status = passedAll ? 'Accepted' : results.some((r) => r.status === 'Error') ? 'Error' : 'Wrong Answer';
    const submission = await ContestSubmission.create({ userId: req.user.userId, problemId, contestId, code, codeUUID: uuidv4(), language, status, testCaseResults: results });
    res.status(201).json({ _id: submission._id, codeUUID: submission.codeUUID, problemId, contestId, language, status, testCaseResults: publicResults(results), createdAt: submission.createdAt });
  } catch (err) {
    console.error('Contest submission error:', err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Submission failed' });
  }
};

export const getContestSubmissions = async (req, res) => {
  const { contestId, problemId } = req.query;
  try {
    if (!mongoose.isValidObjectId(contestId)) return res.status(400).json({ message: 'Invalid contestId' });
    const query = { contestId, userId: req.user.userId };
    if (problemId) {
      if (!mongoose.isValidObjectId(problemId)) return res.status(400).json({ message: 'Invalid problemId' });
      query.problemId = problemId;
    }
    const submissions = await ContestSubmission.find(query).sort({ createdAt: -1 }).lean();
    res.json(submissions.map(({ code, testCaseResults, ...submission }) => ({ ...submission, testCaseResults: publicResults(testCaseResults) })));
  } catch (err) {
    console.error('Get contest submissions error:', err);
    res.status(500).json({ message: 'Failed to fetch contest submissions' });
  }
};

export const getContestLeaderboard = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid contest ID' });
    const contest = await Contest.findById(req.params.id).populate('problems', 'difficulty').lean();
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    const points = Object.fromEntries(contest.problems.map((p) => [String(p._id), p.difficulty === 'Hard' ? 30 : p.difficulty === 'Medium' ? 20 : 10]));
    const submissions = await ContestSubmission.find({ contestId: contest._id, status: 'Accepted' }).populate('userId', 'username').sort({ createdAt: 1 }).lean();
    const scores = new Map();
    for (const sub of submissions) {
      const userId = String(sub.userId?._id || sub.userId);
      const problem = String(sub.problemId);
      if (!points[problem]) continue;
      if (!scores.has(userId)) scores.set(userId, { userId, username: sub.userId?.username || 'Unknown', score: 0, solved: new Set() });
      const entry = scores.get(userId);
      if (!entry.solved.has(problem)) { entry.solved.add(problem); entry.score += points[problem]; }
    }
    res.json([...scores.values()].sort((a, b) => b.score - a.score || b.solved.size - a.solved.size || a.username.localeCompare(b.username)).map((entry, index) => ({ userId: entry.userId, username: entry.username, score: entry.score, solved: entry.solved.size, rank: index + 1 })));
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};
