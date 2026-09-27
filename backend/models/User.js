import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  fullName: { type: String, required: true, trim: true },
  dob: { type: Date },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
