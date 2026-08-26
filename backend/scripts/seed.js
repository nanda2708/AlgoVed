import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import Contest from '../models/Contest.js';
import ContestSubmission from '../models/ContestSubmission.js';
import mongoose from 'mongoose';

dotenv.config();

const demoUsers = [
  { username: 'admin', email: 'admin@algoved.local', fullName: 'AlgoVed Admin', password: 'Admin@12345', isAdmin: true },
  { username: 'alice', email: 'alice@algoved.local', fullName: 'Alice Johnson', password: 'Alice@12345', isAdmin: false },
  { username: 'bob', email: 'bob@algoved.local', fullName: 'Bob Kumar', password: 'Bob@12345', isAdmin: false },
];

const demoProblems = [
  {
    title: 'Sum of Two Numbers', difficulty: 'Easy', tags: ['math', 'implementation'],
    description: 'Read two integers and print their sum.',
    testCases: [
      { input: '2 3\n', output: '5\n', hidden: false },
      { input: '-10 4\n', output: '-6\n', hidden: false },
      { input: '1000000 2000000\n', output: '3000000\n', hidden: true },
    ],
  },
  {
    title: 'Maximum of Three', difficulty: 'Easy', tags: ['conditionals'],
    description: 'Read three integers and print the largest value.',
    testCases: [
      { input: '1 8 3\n', output: '8\n', hidden: false },
      { input: '-2 -9 -4\n', output: '-2\n', hidden: false },
      { input: '7 7 7\n', output: '7\n', hidden: true },
    ],
  },
  {
    title: 'Count Even Numbers', difficulty: 'Medium', tags: ['arrays', 'loops'],
    description: 'Read N followed by N integers. Print how many of them are even.',
    testCases: [
      { input: '5\n1 2 3 4 5\n', output: '2\n', hidden: false },
      { input: '4\n10 12 14 16\n', output: '4\n', hidden: false },
      { input: '6\n-2 -1 0 7 8 11\n', output: '3\n', hidden: true },
    ],
  },
];

const acceptedResult = (testCase) => ({ input: testCase.input, expected: testCase.output, actual: testCase.output, passed: true, hidden: Boolean(testCase.hidden), status: 'Accepted' });

const upsertUser = async (data) => {
  const password = await bcrypt.hash(data.password, 12);
  return User.findOneAndUpdate(
    { username: data.username },
    { $set: { email: data.email, fullName: data.fullName, password, isAdmin: data.isAdmin } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const seed = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  await connectDB();

  const users = Object.fromEntries(await Promise.all(demoUsers.map(async (data) => [data.username, await upsertUser(data)])));
  const problems = [];
  for (const data of demoProblems) {
    const problem = await Problem.findOneAndUpdate(
      { title: data.title },
      { $set: { ...data, createdBy: users.admin._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    problems.push(problem);
  }

  const now = Date.now();
  const contest = await Contest.findOneAndUpdate(
    { title: 'AlgoVed Practice Contest' },
    { $set: { startTime: new Date(now - 60 * 60 * 1000), endTime: new Date(now + 24 * 60 * 60 * 1000), duration: 25 * 60 * 60, problems: problems.map((problem) => problem._id), participants: [users.alice._id, users.bob._id], status: 'ongoing' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const sampleCode = '#include <iostream>\nusing namespace std;\nint main(){ long long a,b; if(cin>>a>>b) cout<<a+b; }';
  for (const [index, username] of ['alice', 'bob'].entries()) {
    const problem = problems[index];
    const testCaseResults = problem.testCases.map(acceptedResult);
    await Submission.findOneAndUpdate(
      { userId: users[username]._id, problemId: problem._id, status: 'Accepted' },
      { $setOnInsert: { userId: users[username]._id, problemId: problem._id, codeUUID: uuidv4(), language: 'cpp', status: 'Accepted', testCaseResults } },
      { upsert: true }
    );
    await ContestSubmission.findOneAndUpdate(
      { userId: users[username]._id, contestId: contest._id, problemId: problem._id, status: 'Accepted' },
      { $setOnInsert: { userId: users[username]._id, contestId: contest._id, problemId: problem._id, code: sampleCode, codeUUID: uuidv4(), language: 'cpp', status: 'Accepted', testCaseResults } },
      { upsert: true }
    );
  }

  console.log(`Seeded ${Object.keys(users).length} users, ${problems.length} problems, and one active contest.`);
};

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
