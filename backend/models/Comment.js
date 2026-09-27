import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
  content: { type: String, required: true, maxlength: 5_000 },
}, { timestamps: true });

export default mongoose.model('Comment', commentSchema);
