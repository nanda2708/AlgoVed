import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  testCases: [{
    input: { type: String, required: true },
    output: { type: String, required: true },
    hidden: { type: Boolean, default: false },
  }],
  tags: { type: [String], default: [] },
  timeLimitMs: { type: Number, default: 2000, min: 100, max: 10_000 },
  memoryLimitMb: { type: Number, default: 256, min: 16, max: 1024 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('Problem', problemSchema);
