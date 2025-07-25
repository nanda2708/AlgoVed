import axios from 'axios';
import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import { v4 as uuidv4 } from 'uuid';

export const createSubmission = async (req, res) => {
  const { problemId, code, language } = req.body;
  const userId = req.user.userId;
  console.log('createSubmission:', { userId, problemId, language, codeLength: code?.length });
  try {
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });
    if (!problemId || !code || !language) {
      return res.status(400).json({ message: 'Missing required fields: problemId, code, or language' });
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
    const submission = new Submission({
      userId,
      problemId,
      codeUUID,
      language,
      status: passedAll ? 'Accepted' : results.some((r) => r.status === 'Error') ? 'Error' : 'Wrong Answer',
      testCaseResults: results,
    });
    await submission.save();
    console.log('Submission saved:', submission._id);
    res.status(201).json(submission);
  } catch (err) {
    console.error('Submission error:', err.message);
    res.status(500).json({ message: 'Submission failed', error: err.message });
  }
};

export const getSubmissions = async (req, res) => {
  const { problemId } = req.query;
  console.log('getSubmissions:', { problemId, userId: req.user.userId });
  try {
    if (!problemId) return res.status(400).json({ message: 'Missing problemId' });
    const submissions = await Submission.find({ 
      problemId, 
      userId: req.user.userId 
    }).sort({ createdAt: -1 });
    console.log('Found submissions:', submissions.length);
    res.json(submissions);
  } catch (err) {
    console.error('Get submissions error:', err.message);
    res.status(500).json({ message: 'Failed to fetch submissions', error: err.message });
  }
};