import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  code: { type: String, default: '// Start coding here' },
  language: { type: String, default: 'cpp' },
  input: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Room', roomSchema);