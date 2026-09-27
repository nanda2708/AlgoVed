import Comment from '../models/Comment.js';
import Problem from '../models/Problem.js';
import mongoose from 'mongoose';

export const createComment = async (req, res) => {
  const { problemId, content } = req.body || {};
  const userId = req.user.userId;
  try {
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
    await comment.populate('userId', 'username');
    res.status(201).json(comment);
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ message: 'Failed to post comment' });
  }
};

export const getComments = async (req, res) => {
  const { problemId } = req.query;
  try {
    if (!mongoose.isValidObjectId(problemId)) return res.status(400).json({ message: 'Invalid problem ID' });
    const comments = await Comment.find({ problemId }).populate('userId', 'username').sort({ createdAt: -1 }).limit(200).lean();
    res.json(comments);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};
