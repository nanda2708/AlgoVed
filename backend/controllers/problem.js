import mongoose from 'mongoose';
import Problem from '../models/Problem.js';

const validateProblemPayload = ({ title, description, difficulty, testCases }) => {
  if (!title?.trim() || !description?.trim()) return 'Title and description are required';
  if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) return 'Difficulty must be Easy, Medium, or Hard';
  if (!Array.isArray(testCases) || testCases.length === 0) return 'At least one test case is required';
  if (testCases.some((tc) => typeof tc.input !== 'string' || typeof tc.output !== 'string')) {
    return 'Every test case must contain string input and output';
  }
  return null;
};

export const createProblem = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const { title, description, difficulty, testCases, tags = [] } = req.body;
    const validationError = validateProblemPayload({ title, description, difficulty, testCases });
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
      tags: Array.isArray(tags) ? tags : [],
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
    const problems = await Problem.find()
      .select('title description difficulty tags createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(problems);
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

    const { title, description, difficulty, testCases, tags } = req.body;
    const validationError = validateProblemPayload({ title, description, difficulty, testCases });
    if (validationError) return res.status(400).json({ message: validationError });

    const updateData = {
      title: title.trim(),
      description,
      difficulty,
      testCases: testCases.map((tc) => ({ input: tc.input, output: tc.output, hidden: Boolean(tc.hidden) })),
      ...(Array.isArray(tags) ? { tags } : {}),
      updatedAt: new Date(),
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
