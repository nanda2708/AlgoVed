import Submission from '../models/Submission.js';
import User from '../models/User.js';

export const getLeaderboard = async (req, res) => {
  try {
    const rows = await Submission.aggregate([
      { $match: { status: 'Accepted' } },
      { $group: { _id: '$userId', acceptedSubmissions: { $sum: 1 }, problems: { $addToSet: '$problemId' }, lastAccepted: { $max: '$createdAt' } } },
      { $project: { userId: '$_id', acceptedSubmissions: 1, problemsSolved: { $size: '$problems' }, lastAccepted: 1, _id: 0 } },
      { $sort: { problemsSolved: -1, acceptedSubmissions: -1, lastAccepted: 1 } },
      { $limit: 100 },
    ]);
    const ids = rows.map((row) => row.userId);
    const users = await User.find({ _id: { $in: ids } }).select('_id username fullName').lean();
    const byId = new Map(users.map((user) => [String(user._id), user]));
    res.json(rows.map((row, index) => {
      const user = byId.get(String(row.userId));
      return { rank: index + 1, username: user?.username || 'Unknown user', fullName: user?.fullName || '', problemsSolved: row.problemsSolved, acceptedSubmissions: row.acceptedSubmissions };
    }));
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
};
