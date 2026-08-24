import Room from '../models/Room.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';

const isMember = (room, userId) => room.users.some((id) => String(id) === String(userId));

export const createRoom = async (req, res) => {
  try {
    const room = await Room.create({ roomId: uuidv4(), users: [req.user.userId], code: '// Start coding here', language: 'cpp', input: '' });
    res.status(201).json({ roomId: room.roomId });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ users: req.user.userId }).sort({ createdAt: -1 }).lean();
    res.status(200).json(rooms.map(({ roomId, users, code, language, input, createdAt }) => ({ roomId, users: users.map(String), code, language, input, createdAt })));
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).lean();
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!isMember(room, req.user.userId)) return res.status(403).json({ message: 'You are not authorized to access this room' });
    res.status(200).json({ roomId: room.roomId, users: room.users.map(String), code: room.code, language: room.language, input: room.input });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const inviteUser = async (req, res) => {
  try {
    const { roomId, username } = req.body;
    if (!roomId || !username?.trim()) return res.status(400).json({ message: 'roomId and username are required' });
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!isMember(room, req.user.userId)) return res.status(403).json({ message: 'You are not authorized to invite users' });
    const user = await User.findOne({ username: username.trim() }).select('_id username');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (isMember(room, user._id)) return res.status(409).json({ message: 'User already in room' });
    room.users.push(user._id);
    await room.save();
    res.status(200).json({ message: 'User invited successfully', userId: user._id });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
