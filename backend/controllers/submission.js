import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import { toPublicResults } from '../models/testCaseResult.js';
import { evaluate, validateCode } from '../services/judge.js';

const toPublicSubmission = ({ _id, problemId, language, status, passed, total, timeMs, compileError, testCaseResults, createdAt, code }) => ({
  _id, problemId, language, status, passed, total, timeMs, compileError, createdAt, code,
  testCaseResults: toPublicResults(testCaseResults),
});

export const createSubmission = async (req, res) => {
  const { problemId, code, language } = req.body || {};
  try {
    if (!mongoose.isValidObjectId(problemId)) return res.status(400).json({ message: 'Invalid problem ID' });
    const invalid = validateCode(code, language);
    if (invalid) return res.status(400).json({ message: invalid });

    const problem = await Problem.findById(problemId).lean();
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    if (!problem.testCases?.length) return res.status(422).json({ message: 'Problem has no test cases configured' });

    const result = await evaluate({ code, problem });
    const submission = await Submission.create({ userId: req.user.userId, problemId, code, language, ...result });
    res.status(201).json(toPublicSubmission(submission.toObject()));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('Submission error:', err);
    res.status(500).json({ message: 'Submission failed' });
  }
};

export const getSubmissions = async (req, res) => {
  const { problemId } = req.query;
  try {
    if (!mongoose.isValidObjectId(problemId)) return res.status(400).json({ message: 'Invalid problemId' });
    const submissions = await Submission.find({ problemId, userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(submissions.map(toPublicSubmission));
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};
