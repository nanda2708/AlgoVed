import mongoose from 'mongoose';

const contestSubmissionSchema = new mongoose.Schema({
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  codeUUID: { type: String, required: true },
  language: { type: String, required: true },
  status: { type: String, required: true },
  testCaseResults: [{
    input: String,
    expected: String,
    actual: String,
    passed: Boolean,
    status: String
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ContestSubmission', contestSubmissionSchema);