import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, trim: true, maxlength: 60, default: 'Untitled room' },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  code: { type: String, default: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n' },
  language: { type: String, default: 'cpp' },
  input: { type: String, default: '' },
}, { timestamps: true });

roomSchema.index({ users: 1, updatedAt: -1 });

export default mongoose.model('Room', roomSchema);