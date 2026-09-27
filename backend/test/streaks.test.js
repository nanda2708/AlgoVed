import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreaks } from '../controllers/user.js';

const today = new Date('2026-03-10T15:00:00Z');

test('counts the current streak when the last solve was today or yesterday', () => {
  assert.deepEqual(computeStreaks(['2026-03-08', '2026-03-09', '2026-03-10'], today), { current: 3, best: 3 });
  assert.deepEqual(computeStreaks(['2026-03-08', '2026-03-09'], today), { current: 2, best: 2 });
});

test('a gap resets the current streak but keeps the best one', () => {
  assert.deepEqual(computeStreaks(['2026-02-01', '2026-02-02', '2026-02-03', '2026-03-10'], today), { current: 1, best: 3 });
  assert.deepEqual(computeStreaks(['2026-03-01'], today), { current: 0, best: 1 });
});

test('handles no activity and unsorted duplicates', () => {
  assert.deepEqual(computeStreaks([], today), { current: 0, best: 0 });
  assert.deepEqual(computeStreaks(['2026-03-10', '2026-03-09', '2026-03-10'], today), { current: 2, best: 2 });
});
