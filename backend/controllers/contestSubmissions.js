import axios from 'axios';
import ContestSubmission from '../models/ContestSubmission.js';
import Problem from '../models/Problem.js';
import { v4 as uuidv4 } from 'uuid';

export const createContestSubmission = async (req, res) => {
  const { problemId, contestId, code, language } = req.body;
  const userId = req.user.userId;
  console.log('createContestSubmission:', { userId, problemId, contestId, language, codeLength: code?.length });
  try {
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });
    if (!problemId || !contestId || !code || !language) {
      return res.status(400).json({ message: 'Missing required fields: problemId, contestId, code, or language' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      console.log('Problem not found:', problemId);
      return res.status(404).json({ message: 'Problem not found' });
    }

    const codeUUID = uuidv4();
    console.log('Generated codeUUID:', codeUUID);

    const results = await Promise.all(
      problem.testCases.map(async (tc, index) => {
        try {
          console.log(`Running test case ${index + 1}:`, { input: tc.input });
          const response = await axios.post(`${process.env.COMPILER_API_URL}/run`, {
            language,
            code,
            input: tc.input,
          }, { timeout: 5000 });
          console.log(`Test case ${index + 1} response:`, response.data);
          const actualOutput = response.data.output || '';
          const passed = actualOutput.trim() === tc.output.trim();
          return {
            input: tc.input,
            expected: tc.output,
            actual: actualOutput,
            passed,
            status: passed ? 'Accepted' : 'Wrong Answer',
          };
        } catch (err) {
          console.error(`Test case ${index + 1} error:`, err.message, err.response?.data);
          return {
            input: tc.input,
            expected: tc.output,
            actual: err.response?.data?.error || err.message,
            passed: false,
            status: 'Error',
          };
        }
      })
    );

    const passedAll = results.every((r) => r.passed);
    const submission = new ContestSubmission({
      userId,
      problemId,
      contestId,
      codeUUID,
      language,
      status: passedAll ? 'Accepted' : results.some((r) => r.status === 'Error') ? 'Error' : 'Wrong Answer',
      testCaseResults: results,
    });
    await submission.save();
    console.log('Contest submission saved:', submission._id);
    res.status(201).json(submission);
  } catch (err) {
    console.error('Contest submission error:', err.message);
    res.status(500).json({ message: 'Submission failed', error: err.message });
  }
};

export const getContestSubmissions = async (req, res) => {
  const { contestId, problemId } = req.query;
  console.log('getContestSubmissions:', { contestId, problemId, userId: req.user.userId });
  try {
    if (!contestId) return res.status(400).json({ message: 'Missing contestId' });
    const query = { contestId, userId: req.user.userId };
    if (problemId) query.problemId = problemId;
    const submissions = await ContestSubmission.find(query).sort({ createdAt: -1 });
    console.log('Found contest submissions:', submissions.length);
    res.json(submissions);
  } catch (err) {
    console.error('Get contest submissions error:', err.message);
    res.status(500).json({ message: 'Failed to fetch contest submissions', error: err.message });
  }
};

export const getContestLeaderboard = async (req, res) => {
  const { id } = req.params;
  console.log('getContestLeaderboard:', { contestId: id });
  try {
    const submissions = await ContestSubmission.find({ contestId: id })
      .populate('userId', 'username')
      .lean();

    const userScores = {};
    submissions.forEach((sub) => {
      if (!userScores[sub.userId._id]) {
        userScores[sub.userId._id] = { username: sub.userId.username, score: 0, solved: new Set() };
      }
      if (sub.status === 'Accepted' && !userScores[sub.userId._id].solved.has(sub.problemId.toString())) {
        userScores[sub.userId._id].score += 20; // Hardcoded 20 points per problem
        userScores[sub.userId._id].solved.add(sub.problemId.toString());
      }
    });

    const leaderboard = Object.entries(userScores)
      .map(([userId, data], index) => ({
        userId,
        username: data.username,
        score: data.score,
        rank: index + 1,
      }))
      .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));

    console.log('Leaderboard generated:', leaderboard.length);
    res.json(leaderboard);
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: err.message });
  }
};