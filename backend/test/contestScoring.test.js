import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankContest, WRONG_ATTEMPT_PENALTY_MINUTES } from '../services/contestScoring.js';

const start = new Date('2026-01-01T10:00:00Z');
const at = (minutes) => new Date(start.getTime() + minutes * 60_000);
const contest = { startTime: start, problems: [{ _id: 'A', difficulty: 'Easy' }, { _id: 'B', difficulty: 'Hard' }] };
const sub = (username, problemId, status, minutes) => ({ userId: username, username, problemId, status, createdAt: at(minutes) });

test('awards points once per problem and adds time plus wrong-attempt penalty', () => {
  const [row] = rankContest(contest, [
    sub('alice', 'A', 'Wrong Answer', 5),
    sub('alice', 'A', 'Accepted', 12),
    sub('alice', 'A', 'Accepted', 20),
  ]);
  assert.equal(row.score, 10);
  assert.equal(row.solved, 1);
  assert.equal(row.penalty, 12 + WRONG_ATTEMPT_PENALTY_MINUTES);
  assert.deepEqual(row.problems.A, { attempts: 2, solved: true, solvedAtMinutes: 12 });
});

test('ranks by score, then penalty, and shares ranks on exact ties', () => {
  const rows = rankContest(contest, [
    sub('carol', 'A', 'Accepted', 30),
    sub('alice', 'A', 'Accepted', 10),
    sub('bob', 'A', 'Accepted', 10),
    sub('dave', 'B', 'Accepted', 50),
  ]);
  assert.deepEqual(rows.map((r) => [r.username, r.rank]), [['dave', 1], ['alice', 2], ['bob', 2], ['carol', 4]]);
});

test('compilation errors are not penalised and unknown problems are ignored', () => {
  const [row] = rankContest(contest, [
    sub('alice', 'A', 'Compilation Error', 1),
    sub('alice', 'Z', 'Accepted', 2),
    sub('alice', 'A', 'Accepted', 3),
  ]);
  assert.equal(row.penalty, 3);
  assert.equal(row.score, 10);
});

test('input order does not matter', () => {
  const forward = [sub('alice', 'A', 'Wrong Answer', 1), sub('alice', 'A', 'Accepted', 2)];
  assert.deepEqual(rankContest(contest, forward), rankContest(contest, [...forward].reverse()));
});
