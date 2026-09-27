import mongoose from 'mongoose';

// A contest's status (upcoming/ongoing/ended) is derived from its time window
// on every read, so it is not stored.
const contestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.model('Contest', contestSchema);
