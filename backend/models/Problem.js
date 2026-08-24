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
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Problem = mongoose.model('Problem', problemSchema);
export default Problem;
