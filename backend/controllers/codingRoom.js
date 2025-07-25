import Room from '../models/Room.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';

// Create a new room
export const createRoom = async (req, res) => {
  try {
    const { userId } = req.user;
    const roomId = uuidv4();
    const room = new Room({
      roomId,
      users: [userId],
      code: '// Start coding here',
      language: 'cpp',
      input: '',
    });
    await room.save();
    console.log('Room created:', { roomId, userId });
    res.status(201).json({ roomId });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all rooms for the user
export const getUserRooms = async (req, res) => {
  try {
    const { userId } = req.user;
    const rooms = await Room.find({ users: userId });
    console.log('User rooms fetched:', { userId, roomCount: rooms.length });
    res.status(200).json(
      rooms.map(room => ({
        roomId: room.roomId,
        users: room.users,
        code: room.code,
        language: room.language,
        input: room.input,
        createdAt: room.createdAt,
      }))
    );
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get room details
export const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.user;
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (!room.users.includes(userId)) {
      return res.status(403).json({ message: 'You are not authorized to access this room' });
    }
    console.log('Room fetched:', { roomId, userId });
    res.status(200).json({
      roomId: room.roomId,
      users: room.users,
      code: room.code,
      language: room.language,
      input: room.input,
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Invite a user to a room
export const inviteUser = async (req, res) => {
  try {
    const { roomId, username } = req.body;
    const { userId } = req.user;
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (!room.users.includes(userId)) {
      return res.status(403).json({ message: 'You are not authorized to invite users' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (room.users.includes(user._id)) {
      return res.status(400).json({ message: 'User already in room' });
    }
    room.users.push(user._id);
    await room.save();
    console.log('User invited:', { roomId, userId: user._id, username });
    res.status(200).json({ message: 'User invited successfully', userId: user._id });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};