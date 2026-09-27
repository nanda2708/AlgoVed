import mongoose from 'mongoose';
import Contest from '../models/Contest.js';
import Problem from '../models/Problem.js';
import ContestSubmission from '../models/ContestSubmission.js';
import { POINTS_BY_DIFFICULTY, rankContest } from '../services/contestScoring.js';

const getLiveStatus = (contest) => {
  const now = Date.now();
  if (now < new Date(contest.startTime).getTime()) return 'upcoming';
  if (now > new Date(contest.endTime).getTime()) return 'ended';
  return 'ongoing';
};

export const createContest = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const { title, startTime, endTime, problems } = req.body || {};
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!title?.trim() || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      return res.status(400).json({ message: 'Valid title, start time, and end time are required' });
    }
    if (end <= start) return res.status(400).json({ message: 'End time must be after start time' });
    if (!Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({ message: 'At least one problem is required' });
    }
    const uniqueProblems = [...new Set(problems.map(String))];
    if (uniqueProblems.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'Invalid problem IDs' });
    }

    const found = await Problem.countDocuments({ _id: { $in: uniqueProblems } });
    if (found !== uniqueProblems.length) return res.status(400).json({ message: 'One or more problem IDs are invalid' });

    const contest = await Contest.create({ title: title.trim(), startTime: start, endTime: end, problems: uniqueProblems });
    res.status(201).json({ ...contest.toObject(), status: getLiveStatus(contest) });
  } catch (err) {
    console.error('Create contest error:', err);
    res.status(500).json({ message: 'Failed to create contest' });
  }
};

export const getContests = async (req, res) => {
  try {
    const contests = await Contest.find().sort({ startTime: -1 }).lean();
    res.json(contests.map(({ _id, title, startTime, endTime, problems, participants }) => ({
      _id,
      title,
      startTime,
      endTime,
      problemCount: problems.length,
      participantCount: participants.length,
      status: getLiveStatus({ startTime, endTime }),
    })));
  } catch (err) {
    console.error('Get contests error:', err);
    res.status(500).json({ message: 'Failed to fetch contests' });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid contest ID' });
    const contest = await Contest.findById(req.params.id).populate('problems', 'title difficulty').lean();
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    const submissions = await ContestSubmission.find({ contestId: contest._id })
      .select('userId problemId status createdAt')
      .populate('userId', 'username')
      .lean();

    const rows = rankContest(contest, submissions.map((s) => ({
      userId: s.userId?._id || s.userId,
      username: s.userId?.username || 'Unknown',
      problemId: s.problemId,
      status: s.status,
      createdAt: s.createdAt,
    })));

    res.json({
      problems: contest.problems.map(({ _id, title, difficulty }) => ({ _id, title, difficulty, points: POINTS_BY_DIFFICULTY[difficulty] ?? 10 })),
      rows,
    });
  } catch (err) {
    console.error('Contest leaderboard error:', err);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};

export const joinContest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid contest ID' });
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    // Registration is open until the contest ends.
    if (getLiveStatus(contest) === 'ended') return res.status(400).json({ message: 'Contest has ended' });

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
    const contest = await Contest.findById(req.params.id).populate('problems', 'title difficulty').lean();
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    const status = getLiveStatus(contest);
    const { _id, title, startTime, endTime, participants } = contest;
    res.json({
      _id,
      title,
      startTime,
      endTime,
      status,
      // Problem titles stay hidden until the contest starts.
      problems: status === 'upcoming' && !req.user.isAdmin ? [] : contest.problems,
      problemCount: contest.problems.length,
      participantCount: participants.length,
      hasJoined: participants.some((id) => String(id) === String(req.user.userId)),
    });
  } catch (err) {
    console.error('Error fetching contest:', err);
    res.status(500).json({ message: 'Failed to fetch contest details' });
  }
};
