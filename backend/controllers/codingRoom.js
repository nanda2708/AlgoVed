import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room.js';
import User from '../models/User.js';

const isMember = (room, userId) => room.users.some((user) => String(user._id || user) === String(userId));
const members = (room) => room.users.map((user) => ({ id: String(user._id), username: user.username }));

const summary = (room) => ({
  roomId: room.roomId,
  name: room.name || 'Untitled room',
  members: members(room),
  updatedAt: room.updatedAt || room.createdAt,
});

export const createRoom = async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim().slice(0, 60) : undefined;
    const room = await Room.create({ roomId: uuidv4(), name, users: [req.user.userId] });
    res.status(201).json({ roomId: room.roomId });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ users: req.user.userId })
      .select('roomId name users updatedAt')
      .populate('users', 'username')
      .sort({ updatedAt: -1 })
      .lean();
    res.json(rooms.map(summary));
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).populate('users', 'username').lean();
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!isMember(room, req.user.userId)) return res.status(403).json({ message: 'You are not a member of this room' });
    res.json({ ...summary(room), code: room.code, language: room.language, input: room.input });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const inviteUser = async (req, res) => {
  try {
    const { roomId, username } = req.body || {};
    if (typeof roomId !== 'string' || typeof username !== 'string' || !username.trim()) return res.status(400).json({ message: 'roomId and username are required' });
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!isMember(room, req.user.userId)) return res.status(403).json({ message: 'Only room members can invite others' });
    const user = await User.findOne({ username: username.trim() }).select('_id username').lean();
    if (!user) return res.status(404).json({ message: 'No user with that username' });
    if (isMember(room, user._id)) return res.status(409).json({ message: `${user.username} is already in this room` });
    await Room.updateOne({ _id: room._id }, { $addToSet: { users: user._id } });
    res.json({ member: { id: String(user._id), username: user.username } });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
