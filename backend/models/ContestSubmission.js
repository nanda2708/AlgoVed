import mongoose from 'mongoose';

const contestSubmissionSchema = new mongoose.Schema({
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  code: { type: String, required: true, maxlength: 100000 },
  codeUUID: { type: String, required: true, unique: true },
  language: { type: String, required: true },
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

export default mongoose.model('ContestSubmission', contestSubmissionSchema);
