import { VERDICTS } from '../models/verdicts.js';

export const WRONG_ATTEMPT_PENALTY_MINUTES = 10;
export const POINTS_BY_DIFFICULTY = { Easy: 10, Medium: 20, Hard: 30 };

// Neither of these says anything about the solution's correctness, so they are not penalised.
const IGNORED_VERDICTS = new Set([VERDICTS.COMPILATION_ERROR, VERDICTS.JUDGE_ERROR, 'Error']);

/**
 * ICPC-style scoring with weighted problems. A problem's points are awarded on
 * the first accepted submission; penalty is the minutes from contest start to
 * that submission plus a fixed penalty for every rejected attempt before it.
 * Rank by score (desc), then penalty (asc); identical rows share a rank.
 *
 * @param contest     { startTime, problems: [{ _id, difficulty }] }
 * @param submissions [{ userId, username, problemId, status, createdAt }] in any order
 */
export const rankContest = (contest, submissions) => {
  const start = new Date(contest.startTime).getTime();
  const points = new Map(contest.problems.map((p) => [String(p._id), POINTS_BY_DIFFICULTY[p.difficulty] ?? 10]));
  const rows = new Map();

  const ordered = [...submissions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  for (const submission of ordered) {
    const problemId = String(submission.problemId);
    if (!points.has(problemId) || IGNORED_VERDICTS.has(submission.status)) continue;

    const userId = String(submission.userId);
    if (!rows.has(userId)) rows.set(userId, { userId, username: submission.username, score: 0, penalty: 0, solved: 0, problems: {} });
    const row = rows.get(userId);
    const cell = row.problems[problemId] ??= { attempts: 0, solved: false, solvedAtMinutes: null };
    if (cell.solved) continue;

    cell.attempts += 1;
    if (submission.status === VERDICTS.ACCEPTED) {
      const minutes = Math.max(0, Math.floor((new Date(submission.createdAt).getTime() - start) / 60_000));
      cell.solved = true;
      cell.solvedAtMinutes = minutes;
      row.solved += 1;
      row.score += points.get(problemId);
      row.penalty += minutes + (cell.attempts - 1) * WRONG_ATTEMPT_PENALTY_MINUTES;
    }
  }

  const sorted = [...rows.values()].sort((a, b) => b.score - a.score || a.penalty - b.penalty || a.username.localeCompare(b.username));
  sorted.forEach((row, index) => {
    const previous = sorted[index - 1];
    row.rank = previous && previous.score === row.score && previous.penalty === row.penalty ? previous.rank : index + 1;
  });
  return sorted;
};
