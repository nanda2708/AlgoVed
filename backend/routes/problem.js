  import express from 'express'
  import {
    getAllProblems,
    getProblem,
    createProblem,
    updateProblem,
    deleteProblem
  } from '../controllers/problem.js';
  import auth from '../middleware/auth.js';
  const router = express.Router()

  // Protected routes (require authentication)
  router.get('/', auth, getAllProblems); // GET /api/problems
  router.get('/:id', auth, getProblem); // GET /api/problems/:id

  // Admin-only routes
  router.post('/', auth, createProblem); // POST /api/problems
  router.put('/:id', auth, updateProblem); // PUT /api/problems/:id
  router.delete('/:id', auth, deleteProblem); // DELETE /api/problems/:id

  export default router;