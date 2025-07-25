import mongoose from "mongoose";

const contestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in seconds
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  status: { type: String, enum: ['ongoing', 'upcoming', 'ended'], default: 'upcoming' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Contest', contestSchema);