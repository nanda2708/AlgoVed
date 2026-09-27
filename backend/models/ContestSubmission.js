import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { VERDICT_VALUES } from './verdicts.js';
import { testCaseResultSchema } from './testCaseResult.js';

const contestSubmissionSchema = new mongoose.Schema({
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true, maxlength: 100_000 },
  codeUUID: { type: String, default: uuidv4, required: true, unique: true },
  language: { type: String, required: true },
  status: { type: String, enum: VERDICT_VALUES, required: true },
  passed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  timeMs: { type: Number, default: 0 },
  compileError: String,
  testCaseResults: [testCaseResultSchema],
}, { timestamps: true });

contestSubmissionSchema.index({ contestId: 1, createdAt: 1 });
contestSubmissionSchema.index({ contestId: 1, userId: 1, problemId: 1 });

export default mongoose.model('ContestSubmission', contestSubmissionSchema);
