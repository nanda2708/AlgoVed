import mongoose from 'mongoose';
import ContestSubmission from '../models/ContestSubmission.js';
import Problem from '../models/Problem.js';
import Contest from '../models/Contest.js';
import { toPublicResults } from '../models/testCaseResult.js';
import { evaluate, validateCode } from '../services/judge.js';

const toPublicSubmission = ({ _id, contestId, problemId, language, status, passed, total, timeMs, compileError, testCaseResults, createdAt }) => ({
  _id, contestId, problemId, language, status, passed, total, timeMs, compileError, createdAt,
  testCaseResults: toPublicResults(testCaseResults),
});

export const createContestSubmission = async (req, res) => {
  const { problemId, contestId, code, language } = req.body || {};
  try {
    if (!mongoose.isValidObjectId(problemId) || !mongoose.isValidObjectId(contestId)) return res.status(400).json({ message: 'Invalid problem or contest ID' });
    const invalid = validateCode(code, language);
    if (invalid) return res.status(400).json({ message: invalid });

    const [contest, problem] = await Promise.all([Contest.findById(contestId).lean(), Problem.findById(problemId).lean()]);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    if (!contest.problems.some((id) => String(id) === String(problemId))) return res.status(400).json({ message: 'Problem is not part of this contest' });
    if (!problem.testCases?.length) return res.status(422).json({ message: 'Problem has no test cases configured' });

    const now = Date.now();
    if (now < new Date(contest.startTime).getTime() || now > new Date(contest.endTime).getTime()) return res.status(400).json({ message: 'Contest is not active' });
    if (!contest.participants.some((id) => String(id) === String(req.user.userId))) return res.status(403).json({ message: 'Join the contest before submitting' });

    const result = await evaluate({ code, problem });
    const submission = await ContestSubmission.create({ userId: req.user.userId, problemId, contestId, code, language, ...result });
    res.status(201).json(toPublicSubmission(submission.toObject()));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('Contest submission error:', err);
    res.status(500).json({ message: 'Submission failed' });
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
    res.json(submissions.map(toPublicSubmission));
  } catch (err) {
    console.error('Get contest submissions error:', err);
    res.status(500).json({ message: 'Failed to fetch contest submissions' });
  }
};
