import Problem from '../models/Problem.js'
// Create a new problem (admin only)
export const createProblem = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { title, description, difficulty, testCases, tags = [] } = req.body;
    const problem = new Problem({
      title,
      description,
      difficulty,
      testCases,
      tags,
      createdBy: req.user.userId,
    });
    await problem.save();
    res.status(201).json({ message: 'Problem created', problem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all problems (authenticated users)
export const getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find()
      .select('title description difficulty tags createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json(problems);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single problem by ID (authenticated users)
export const getProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).select('-testCases.hidden');
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.status(200).json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a problem (admin only)
export const updateProblem = async (req, res) => {
  try {
    const { isAdmin } = req.user;
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { title, description, difficulty, testCases, tags } = req.body;
    const updateData = {
      title,
      description,
      difficulty,
      testCases,
      updatedAt: Date.now(),
    };

    if (tags) updateData.tags = tags;

    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true } //Returns the new problem after the changes are applied
    );
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.status(200).json({ message: 'Problem updated', problem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a problem (admin only)
export const deleteProblem = async (req, res) => {
  try {
    const { isAdmin } = req.user;
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.status(200).json({ message: 'Problem deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};