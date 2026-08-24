import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
  codeUUID: { type: String, default: uuidv4, required: true, unique: true },
  language: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Accepted', 'Wrong Answer', 'Error'], required: true },
  testCaseResults: [{
    input: String,
    expected: String,
    actual: String,
    passed: Boolean,
    hidden: { type: Boolean, default: false },
    status: { type: String, enum: ['Accepted', 'Wrong Answer', 'Error'] },
  }],
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
