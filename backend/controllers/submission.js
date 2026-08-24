import axios from 'axios';
import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import { v4 as uuidv4 } from 'uuid';

const normalizeOutput = (value) => String(value ?? '').replace(/\r\n/g, '\n').trim();

export const createSubmission = async (req, res) => {
  const { problemId, code, language } = req.body;
  const userId = req.user.userId;

  try {
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });
    if (!mongoose.isValidObjectId(problemId)) return res.status(400).json({ message: 'Invalid problem ID' });
    if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ message: 'Code is required' });
    if (code.length > 100_000) return res.status(413).json({ message: 'Code is too large' });
    if (typeof language !== 'string' || language !== 'cpp') return res.status(400).json({ message: 'Only C++ submissions are currently supported' });
    if (!process.env.COMPILER_API_URL) return res.status(503).json({ message: 'Compiler service is not configured' });

    const problem = await Problem.findById(problemId).lean();
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    if (!Array.isArray(problem.testCases) || problem.testCases.length === 0) {
      return res.status(422).json({ message: 'Problem has no test cases configured' });
    }

    const results = [];
    for (const tc of problem.testCases) {
      try {
        const response = await axios.post(`${process.env.COMPILER_API_URL.replace(/\/$/, '')}/run`, {
          language,
          code,
          input: tc.input,
        }, { timeout: 15_000, maxContentLength: 1_000_000, maxBodyLength: 1_000_000 });

        const actualOutput = response.data?.output ?? '';
        results.push({
          input: tc.input,
          expected: tc.output,
          actual: actualOutput,
          passed: normalizeOutput(actualOutput) === normalizeOutput(tc.output),
          hidden: Boolean(tc.hidden),
          status: normalizeOutput(actualOutput) === normalizeOutput(tc.output) ? 'Accepted' : 'Wrong Answer',
        });
      } catch (err) {
        results.push({
          input: tc.input,
          expected: tc.output,
          actual: err.response?.data?.error || err.message,
          passed: false,
          hidden: Boolean(tc.hidden),
          status: 'Error',
        });
      }

      // Stop early on a failed test case. Hidden tests remain on the server and are never returned to clients.
      if (!results[results.length - 1].passed) break;
    }

    const passedAll = results.length === problem.testCases.length && results.every((r) => r.passed);
    const status = passedAll ? 'Accepted' : results.some((r) => r.status === 'Error') ? 'Error' : 'Wrong Answer';

    const submission = await Submission.create({
      userId,
      problemId,
      codeUUID: uuidv4(),
      language,
      status,
      testCaseResults: results,
    });

    // Never send hidden input/expected output back to the browser.
    const publicResults = results.map(({ input, expected, actual, passed, hidden, status: testStatus }) => (
      hidden
        ? { passed, status: testStatus }
        : { input, expected, actual, passed, status: testStatus }
    ));

    res.status(201).json({
      _id: submission._id,
      codeUUID: submission.codeUUID,
      problemId: submission.problemId,
      language: submission.language,
      status: submission.status,
      testCaseResults: publicResults,
      createdAt: submission.createdAt,
    });
  } catch (err) {
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
      .lean();

    const safeSubmissions = submissions.map((submission) => ({
      ...submission,
      testCaseResults: (submission.testCaseResults || []).map(({ input, expected, actual, passed, hidden, status }) => (
        hidden ? { passed, status } : { input, expected, actual, passed, status }
      )),
    }));

    res.json(safeSubmissions);
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};
