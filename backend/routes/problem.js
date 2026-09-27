import express from 'express';
import { getAllProblems, getProblem, createProblem, updateProblem, deleteProblem } from '../controllers/problem.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getAllProblems);
router.get('/:id', auth, getProblem);

// Admin only; the controllers check req.user.isAdmin.
router.post('/', auth, createProblem);
router.put('/:id', auth, updateProblem);
router.delete('/:id', auth, deleteProblem);

export default router;
