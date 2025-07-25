import express from 'express'
import { check } from 'express-validator'
import loginController from '../controllers/login.js'
import signupController from '../controllers/signup.js'
import getme from '../controllers/getme.js';
import auth from '../middleware/auth.js'

const router = express.Router();

router.post(
  '/signup',
  [
    check('username').notEmpty().isLength({ min: 3 }),
    check('password').isLength({ min: 6 }),
    check('email').isEmail(),
    check('fullName').notEmpty(),
  ],
  signupController
);

router.post(
  '/login',
  [check('username').notEmpty(), check('password').notEmpty()],
  loginController
);


router.get('/me', auth, getme);
export default router;