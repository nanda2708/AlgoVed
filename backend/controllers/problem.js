import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { VERDICTS } from '../models/verdicts.js';

const validateProblemPayload = ({ title, description, difficulty, testCases, timeLimitMs, memoryLimitMb }) => {
  if (!title?.trim() || !description?.trim()) return 'Title and description are required';
  if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) return 'Difficulty must be Easy, Medium, or Hard';
  if (!Array.isArray(testCases) || testCases.length === 0) return 'At least one test case is required';
  if (testCases.some((tc) => typeof tc.input !== 'string' || typeof tc.output !== 'string')) {
    return 'Every test case must contain string input and output';
  }
  if (timeLimitMs !== undefined && !(Number(timeLimitMs) >= 100 && Number(timeLimitMs) <= 10_000)) return 'Time limit must be between 100 and 10000 ms';
  if (memoryLimitMb !== undefined && !(Number(memoryLimitMb) >= 16 && Number(memoryLimitMb) <= 1024)) return 'Memory limit must be between 16 and 1024 MB';
  return null;
};

const cleanTags = (tags) => (Array.isArray(tags) ? [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))] : []);

export const createProblem = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const { title, description, difficulty, testCases, tags = [], timeLimitMs, memoryLimitMb } = req.body || {};
    const validationError = validateProblemPayload(req.body || {});
    if (validationError) return res.status(400).json({ message: validationError });

    const problem = await Problem.create({
      title: title.trim(),
      description,
      difficulty,
      testCases: testCases.map((tc) => ({
        input: tc.input,
        output: tc.output,
        hidden: Boolean(tc.hidden),
      })),
      tags: cleanTags(tags),
      ...(timeLimitMs !== undefined ? { timeLimitMs: Number(timeLimitMs) } : {}),
      ...(memoryLimitMb !== undefined ? { memoryLimitMb: Number(memoryLimitMb) } : {}),
      createdBy: req.user.userId,
    });
    res.status(201).json({ message: 'Problem created', problem });
  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllProblems = async (req, res) => {
  try {
    const [problems, solved, attempted] = await Promise.all([
      Problem.find().select('title description difficulty tags createdAt').sort({ createdAt: -1 }).lean(),
      Submission.distinct('problemId', { userId: req.user.userId, status: VERDICTS.ACCEPTED }),
      Submission.distinct('problemId', { userId: req.user.userId }),
    ]);
    const solvedIds = new Set(solved.map(String));
    const attemptedIds = new Set(attempted.map(String));

    res.status(200).json(problems.map((problem) => {
      const id = String(problem._id);
      return {
        ...problem,
        // Only a short preview is needed for the list view.
        description: problem.description.slice(0, 280),
        userStatus: solvedIds.has(id) ? 'solved' : attemptedIds.has(id) ? 'attempted' : null,
      };
    }));
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProblem = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid problem ID' });
    }

    const problem = await Problem.findById(req.params.id).lean();
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    // Hidden judge data is available only to an authenticated admin editing a problem.
    if (!req.user.isAdmin) {
      problem.testCases = (problem.testCases || []).filter((tc) => !tc.hidden).map(({ input, output }) => ({ input, output }));
    }
    res.status(200).json(problem);
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProblem = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid problem ID' });

    const { title, description, difficulty, testCases, tags, timeLimitMs, memoryLimitMb } = req.body || {};
    const validationError = validateProblemPayload(req.body || {});
    if (validationError) return res.status(400).json({ message: validationError });

    const updateData = {
      title: title.trim(),
      description,
      difficulty,
      testCases: testCases.map((tc) => ({ input: tc.input, output: tc.output, hidden: Boolean(tc.hidden) })),
      ...(Array.isArray(tags) ? { tags: cleanTags(tags) } : {}),
      ...(timeLimitMs !== undefined ? { timeLimitMs: Number(timeLimitMs) } : {}),
      ...(memoryLimitMb !== undefined ? { memoryLimitMb: Number(memoryLimitMb) } : {}),
    };

    const problem = await Problem.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.status(200).json({ message: 'Problem updated', problem });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProblem = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid problem ID' });

    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.status(200).json({ message: 'Problem deleted' });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
