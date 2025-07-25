import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  codeUUID: { type: String, default: uuidv4, required: true },
  language: { type: String, required: true },
  status: { type: String, enum: ['Accepted', 'Wrong Answer', 'Error'], required: true },
  testCaseResults: [
    {
      input: String,
      expected: String,
      actual: String,
      passed: Boolean,
      status: { type: String, enum: ['Accepted', 'Wrong Answer', 'Error'] },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Submission', submissionSchema);