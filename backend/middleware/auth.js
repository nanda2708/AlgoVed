import jwt from 'jsonwebtoken';
import User from '../models/User.js' 
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('_id isAdmin');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = { userId: user._id, isAdmin: user.isAdmin || false };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default auth;