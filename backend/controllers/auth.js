import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d';

const issueToken = (user) => jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
const publicUser = (user) => ({ id: user._id, username: user.username, email: user.email, fullName: user.fullName });
const firstValidationError = (req) => validationResult(req).array()[0]?.msg;

export const signup = async (req, res) => {
  const invalid = firstValidationError(req);
  if (invalid) return res.status(400).json({ message: invalid });

  const username = req.body.username.trim();
  const email = req.body.email.trim().toLowerCase();
  const fullName = req.body.fullName.trim();
  const { password, dob } = req.body;

  try {
    const existing = await User.findOne({ $or: [{ username }, { email }] }).select('username').lean();
    if (existing) {
      return res.status(409).json({ message: existing.username === username ? 'Username is already taken' : 'An account with this email already exists' });
    }

    const user = await User.create({ username, email, fullName, dob: dob || undefined, password: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'Username or email already exists' });
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  const invalid = firstValidationError(req);
  if (invalid) return res.status(400).json({ message: invalid });

  // The same field accepts a username or an email address.
  const identifier = req.body.username.trim();
  try {
    const user = await User.findOne(identifier.includes('@') ? { email: identifier.toLowerCase() } : { username: identifier });
    // Compare against a dummy hash when the user does not exist so response
    // timing does not reveal which usernames are registered.
    const hash = user?.password || '$2b$12$tQ7rEsolxgPjRHZXF77oyeDKgW9eQ48Qn4BSrii8aFZQ/.rDH4hj2';
    const matches = await bcrypt.compare(req.body.password, hash);
    if (!user || !matches) return res.status(401).json({ message: 'Invalid username or password' });

    res.json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
