import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import Contest from '../models/Contest.js';
import ContestSubmission from '../models/ContestSubmission.js';
import mongoose from 'mongoose';

dotenv.config();

const demoUsers = [
  { username: 'admin', email: 'admin@algoved.local', fullName: 'AlgoVed Admin', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345', isAdmin: true },
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

const acceptedResult = (testCase) => ({ input: testCase.input, expected: testCase.output, actual: testCase.output, hidden: Boolean(testCase.hidden), status: 'Accepted', timeMs: 3 });

// Existing accounts keep their password, so re-running the seed never resets a changed one.
const upsertUser = async ({ password, ...data }) => User.findOneAndUpdate(
  { username: data.username },
  { $set: { email: data.email, fullName: data.fullName, isAdmin: data.isAdmin }, $setOnInsert: { password: await bcrypt.hash(password, 12) } },
  { new: true, upsert: true, setDefaultsOnInsert: true }
);

const seed = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error('Set SEED_ADMIN_PASSWORD before seeding a production database');
  }
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
    { $set: { startTime: new Date(now - 60 * 60 * 1000), endTime: new Date(now + 24 * 60 * 60 * 1000), problems: problems.map((problem) => problem._id), participants: [users.alice._id, users.bob._id] } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const solutions = [
    '#include <iostream>\nint main() { long long a, b; std::cin >> a >> b; std::cout << a + b << "\\n"; }',
    '#include <algorithm>\n#include <iostream>\nint main() { long long a, b, c; std::cin >> a >> b >> c; std::cout << std::max({a, b, c}) << "\\n"; }',
  ];
  for (const [index, username] of ['alice', 'bob'].entries()) {
    const problem = problems[index];
    const testCaseResults = problem.testCases.map(acceptedResult);
    const judged = { code: solutions[index], language: 'cpp', status: 'Accepted', passed: testCaseResults.length, total: testCaseResults.length, timeMs: 3, testCaseResults };
    await Submission.findOneAndUpdate(
      { userId: users[username]._id, problemId: problem._id, status: 'Accepted' },
      { $setOnInsert: { userId: users[username]._id, problemId: problem._id, ...judged } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    await ContestSubmission.findOneAndUpdate(
      { userId: users[username]._id, contestId: contest._id, problemId: problem._id, status: 'Accepted' },
      { $setOnInsert: { userId: users[username]._id, contestId: contest._id, problemId: problem._id, ...judged } },
      { upsert: true, setDefaultsOnInsert: true }
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
