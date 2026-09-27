import mongoose from 'mongoose';
import { VERDICT_VALUES } from './verdicts.js';

const MAX_STORED_TEXT = 4_000;
export const truncate = (value) => {
  const text = String(value ?? '');
  return text.length > MAX_STORED_TEXT ? `${text.slice(0, MAX_STORED_TEXT)}\n… (truncated)` : text;
};

export const testCaseResultSchema = new mongoose.Schema({
  status: { type: String, enum: VERDICT_VALUES },
  hidden: { type: Boolean, default: false },
  timeMs: Number,
  input: String,
  expected: String,
  actual: String,
  error: String,
  // Legacy field from the first judge implementation.
  passed: Boolean,
}, { _id: false });

// Hidden test data never leaves the server; only the verdict and time do.
export const toPublicResults = (results = []) => results.map((r) => (r.hidden
  ? { status: r.status, timeMs: r.timeMs, hidden: true }
  : { status: r.status, timeMs: r.timeMs, input: r.input, expected: r.expected, actual: r.actual, error: r.error }));
