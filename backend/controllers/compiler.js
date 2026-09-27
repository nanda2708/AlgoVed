import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import { toPublicResults } from '../models/testCaseResult.js';
import { evaluate, MAX_INPUT_LENGTH, reviewCode as requestReview, runCode as requestRun, validateCode } from '../services/judge.js';

const sendJudgeError = (res, error, fallback) => {
  if (!error.status) console.error(fallback, error);
  res.status(error.status || 500).json({ message: error.status ? error.message : fallback });
};

export const runCode = async (req, res) => {
  const { language = 'cpp', code, input = '' } = req.body || {};
  const invalid = validateCode(code, language);
  if (invalid) return res.status(400).json({ message: invalid });
  if (typeof input !== 'string' || input.length > MAX_INPUT_LENGTH) return res.status(413).json({ message: 'Input is too large' });

  try {
    const result = await requestRun({ code, input });
    return res.json(result);
  } catch (error) {
    return sendJudgeError(res, error, 'Code execution failed');
  }
};

// Runs the code against a problem's sample (non-hidden) tests without recording a submission.
export const runSamples = async (req, res) => {
  const { problemId, language = 'cpp', code } = req.body || {};
  const invalid = validateCode(code, language);
  if (invalid) return res.status(400).json({ message: invalid });
  if (!mongoose.isValidObjectId(problemId)) return res.status(400).json({ message: 'Invalid problem ID' });

  try {
    const problem = await Problem.findById(problemId).lean();
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    const samples = (problem.testCases || []).filter((tc) => !tc.hidden);
    if (!samples.length) return res.status(422).json({ message: 'This problem has no sample tests' });

    const result = await evaluate({ code, problem, testCases: samples, stopOnFailure: false });
    return res.json({ ...result, testCaseResults: toPublicResults(result.testCaseResults) });
  } catch (error) {
    return sendJudgeError(res, error, 'Sample run failed');
  }
};

export const reviewCode = async (req, res) => {
  const { code } = req.body || {};
  const invalid = validateCode(code);
  if (invalid) return res.status(400).json({ message: invalid });

  try {
    const { review } = await requestReview(code);
    return res.json({ review: review || '' });
  } catch (error) {
    return sendJudgeError(res, error, 'Code review failed');
  }
};
