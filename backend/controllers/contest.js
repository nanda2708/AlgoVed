import mongoose from 'mongoose';
import Contest from '../models/Contest.js';
import Problem from '../models/Problem.js';
import ContestSubmission from '../models/ContestSubmission.js';

const getLiveStatus = (contest) => {
  const now = Date.now();
  if (now < new Date(contest.startTime).getTime()) return 'upcoming';
  if (now > new Date(contest.endTime).getTime()) return 'ended';
  return 'ongoing';
};

export const createContest = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const { title, startTime, endTime, duration, problems } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationNumber = Number(duration);

    if (!title?.trim() || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      return res.status(400).json({ message: 'Valid title, start time, and end time are required' });
    }
    if (end <= start) return res.status(400).json({ message: 'End time must be after start time' });
    if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      return res.status(400).json({ message: 'Duration must be a positive number of seconds' });
    }
    if (!Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({ message: 'At least one problem is required' });
    }
    const uniqueProblems = [...new Set(problems.map(String))];
    if (uniqueProblems.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'Invalid problem IDs' });
    }

    const problemDocs = await Problem.find({ _id: { $in: uniqueProblems } }).select('_id');
    if (problemDocs.length !== uniqueProblems.length) return res.status(400).json({ message: 'One or more problem IDs are invalid' });

    const contest = await Contest.create({
      title: title.trim(),
      startTime: start,
      endTime: end,
      duration: durationNumber,
      problems: uniqueProblems,
      status: getLiveStatus({ startTime: start, endTime: end }),
      participants: [],
    });
    res.status(201).json(contest);
  } catch (err) {
    console.error('Create contest error:', err);
    res.status(500).json({ message: 'Failed to create contest' });
  }
};

export const getContests = async (req, res) => {
  try {
    const contests = await Contest.find().select('_id title startTime endTime duration problems status createdAt').lean();
    res.json(contests.map((contest) => ({ ...contest, status: getLiveStatus(contest) })));
  } catch (err) {
    console.error('Get contests error:', err);
    res.status(500).json({ message: 'Failed to fetch contests' });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid contest ID' });
    const contest = await Contest.findById(req.params.id).populate('problems', 'difficulty').lean();
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    const problemPoints = Object.fromEntries((contest.problems || []).map((p) => [
      String(p._id), p.difficulty === 'Hard' ? 30 : p.difficulty === 'Medium' ? 20 : 10,
    ]));

    const submissions = await ContestSubmission.find({ contestId: contest._id, status: 'Accepted' })
      .populate('userId', 'username')
      .sort({ createdAt: 1 })
      .lean();

    const scores = new Map();
    for (const submission of submissions) {
      const userId = String(submission.userId?._id || submission.userId);
      const problemId = String(submission.problemId);
      if (!problemPoints[problemId]) continue;
      if (!scores.has(userId)) scores.set(userId, { userId, username: submission.userId?.username || 'Unknown', score: 0, solved: new Set() });
      const entry = scores.get(userId);
      if (!entry.solved.has(problemId)) {
        entry.solved.add(problemId);
        entry.score += problemPoints[problemId];
      }
    }

    const leaderboard = [...scores.values()]
      .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username))
      .map((entry, index) => ({ userId: entry.userId, username: entry.username, score: entry.score, solved: entry.solved.size, rank: index + 1 }));

    res.json(leaderboard);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};

export const joinContest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid contest ID' });
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    if (getLiveStatus(contest) !== 'ongoing') return res.status(400).json({ message: 'Contest is not active' });

    const updated = await Contest.findOneAndUpdate(
      { _id: contest._id, participants: { $ne: req.user.userId } },
      { $addToSet: { participants: req.user.userId } },
      { new: true }
    );
    if (!updated) return res.status(409).json({ message: 'Already joined contest' });
    res.json({ message: 'Joined contest successfully' });
  } catch (err) {
    console.error('Join contest error:', err);
    res.status(500).json({ message: 'Failed to join contest' });
  }
};

export const displayContest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid contest ID' });
    const contest = await Contest.findById(req.params.id)
      .populate('problems', 'title description difficulty')
      .populate('participants', '_id username')
      .lean();
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    const status = getLiveStatus(contest);
    res.json({
      ...contest,
      status,
      hasJoined: contest.participants.some((participant) => String(participant._id) === String(req.user.userId)),
    });
  } catch (err) {
    console.error('Error fetching contest:', err);
    res.status(500).json({ message: 'Failed to fetch contest details' });
  }
};
