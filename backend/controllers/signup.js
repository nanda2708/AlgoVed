import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const username = req.body.username.trim();
  const email = req.body.email.trim().toLowerCase();
  const fullName = req.body.fullName.trim();
  const { password, dob } = req.body;

  try {
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Authentication service is not configured' });

    const existingUser = await User.findOne({ $or: [{ username }, { email }] }).select('_id username email');
    if (existingUser) return res.status(409).json({ message: 'Username or email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ username, password: hashedPassword, email, fullName, dob });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName } });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'Username or email already exists' });
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default signup;
