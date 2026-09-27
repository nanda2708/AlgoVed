import express from 'express';
import { createRoom, getUserRooms, getRoom, inviteUser } from '../controllers/codingRoom.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/create', auth, createRoom);
router.get('/user/rooms', auth, getUserRooms);
router.post('/invite', auth, inviteUser);
router.get('/:roomId', auth, getRoom);

export default router;
