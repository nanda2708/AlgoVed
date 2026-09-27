import User from '../models/User.js';
import Submission from '../models/Submission.js';
import { VERDICTS } from '../models/verdicts.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Streaks are counted in UTC days on which the user got at least one Accepted verdict.
export const computeStreaks = (dayKeys, today = new Date()) => {
  const days = [...new Set(dayKeys)].sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const day of days) {
    const time = Date.parse(day);
    run = previous !== null && time - previous === DAY_MS ? run + 1 : 1;
    best = Math.max(best, run);
    previous = time;
  }

  const todayKey = today.toISOString().slice(0, 10);
  const yesterdayKey = new Date(Date.parse(todayKey) - DAY_MS).toISOString().slice(0, 10);
  const last = days[days.length - 1];
  const current = last === todayKey || last === yesterdayKey ? run : 0;
  return { current, best };
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('username email fullName isAdmin createdAt').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyStats = async (req, res) => {
  const userId = req.user.userId;
  try {
    const [verdicts, solvedByDifficulty, acceptedDays, recent] = await Promise.all([
      Submission.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $match: { userId, status: VERDICTS.ACCEPTED } },
        { $group: { _id: '$problemId' } },
        { $lookup: { from: 'problems', localField: '_id', foreignField: '_id', as: 'problem' } },
        { $unwind: '$problem' },
        { $group: { _id: '$problem.difficulty', count: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $match: { userId, status: VERDICTS.ACCEPTED } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
      ]),
      Submission.find({ userId })
        .select('problemId status timeMs createdAt')
        .populate('problemId', 'title')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const byVerdict = Object.fromEntries(verdicts.map(({ _id, count }) => [_id, count]));
    const totalSubmissions = verdicts.reduce((sum, { count }) => sum + count, 0);
    const accepted = byVerdict[VERDICTS.ACCEPTED] || 0;
    const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
    for (const { _id, count } of solvedByDifficulty) byDifficulty[_id] = count;

    res.json({
      solved: Object.values(byDifficulty).reduce((sum, count) => sum + count, 0),
      solvedByDifficulty: byDifficulty,
      totalSubmissions,
      acceptanceRate: totalSubmissions ? Math.round((accepted / totalSubmissions) * 1000) / 10 : 0,
      verdicts: byVerdict,
      streak: computeStreaks(acceptedDays.map(({ _id }) => _id)),
      recentSubmissions: recent.map((s) => ({
        _id: s._id,
        problemId: s.problemId?._id,
        problemTitle: s.problemId?.title || 'Deleted problem',
        status: s.status,
        timeMs: s.timeMs,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to load statistics' });
  }
};
