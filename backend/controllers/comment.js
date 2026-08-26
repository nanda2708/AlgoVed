import Comment from '../models/Comment.js';
import Problem from '../models/Problem.js';
import mongoose from 'mongoose';

export const createComment = async (req, res) => {
  const { problemId, content } = req.body;
  const userId = req.user.userId; // Changed from req.user.id
  try {
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    if (!mongoose.isValidObjectId(problemId)) return res.status(400).json({ message: 'Invalid problem ID' });
    if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ message: 'Comment content is required' });
    if (content.trim().length > 5_000) return res.status(413).json({ message: 'Comment is too large' });

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const comment = new Comment({
      userId,
      problemId,
      content: content.trim(),
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to post comment', error: err.message });
  }
};

export const getComments = async (req, res) => {
  const { problemId } = req.query;
  try {
    if (!mongoose.isValidObjectId(problemId)) return res.status(400).json({ message: 'Invalid problem ID' });
    const comments = await Comment.find({ problemId }).populate('userId', 'username').sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch comments', error: err.message });
  }
};
