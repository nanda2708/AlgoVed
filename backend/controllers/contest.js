import Contest from '../models/Contest.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';

export const createContest = async (req, res) => {
  try {
    const { title, startTime, endTime, duration, problems, status } = req.body;
    if (!title || !startTime || !endTime || !duration || !problems) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Check if user is admin (optional, adjust based on your auth logic)
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    // Verify problems exist
    const problemDocs = await Problem.find({ _id: { $in: problems } });
    if (problemDocs.length !== problems.length) {
      return res.status(400).json({ message: 'Invalid problem IDs' });
    }
    const contest = new Contest({
      title,
      startTime,
      endTime,
      duration,
      problems,
      status: status || 'upcoming',
      participants: [],
    });
    await contest.save();
    res.status(201).json(contest);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create contest', error: err.message });
  }
};

export const getContests = async (req, res) => {
  try {
    const contests = await Contest.find().select('_id title startTime endTime duration problems status');
    res.json(contests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch contests', error: err.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const contest = await Contest.findById(id).populate('participants', 'username');
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    // Mock leaderboard (replace with submission-based scoring)
    const leaderboard = contest.participants.map((user, index) => ({
      userId: user._id,
      username: user.username,
      score: Math.floor(Math.random() * 100), // Replace with actual score
      rank: index + 1,
    })).sort((a, b) => b.score - a.score);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: err.message });
  }
};

export const joinContest = async (req, res) => {
  try {
    const { id } = req.params;
    const contest = await Contest.findById(id);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    const now = new Date();
    if (now < new Date(contest.startTime) || now > new Date(contest.endTime)) {
      return res.status(400).json({ message: 'Contest is not active' });
    }
    if (contest.participants.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already joined contest' });
    }
    contest.participants.push(req.user.userId);
    await contest.save();
    res.json({ message: 'Joined contest successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to join contest', error: err.message });
  }
};

export const displayContest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId; 

    const contest = await Contest.findById(id)
      .populate('problems', 'title description difficulty')
      .populate('participants', '_id username email');

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Determine if the user has joined the contest
    const hasJoined = contest.participants.some((participant) => {
      console.log('userId:', userId);
      console.log('participant IDs:', participant._id);
      return participant._id.toString() === userId.toString()
    });

    res.json({
      _id: contest._id,
      title: contest.title,
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
      status: contest.status,
      problems: contest.problems,
      participants: contest.participants,
      hasJoined,
      createdAt: contest.createdAt
    });
  } catch (err) {
    console.error('Error fetching contest:', err);
    res.status(500).json({
      message: 'Failed to fetch contest details',
      error: err.message
    });
  }
};