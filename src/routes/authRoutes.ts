import express from 'express';
import { body } from 'express-validator';

import {
  getCurrentLoggedInUser,
  loginUser,
  registerUser,
} from 'controllers/authController';
import authMiddleware from 'middlewares/authMiddleware';
import validationMiddleware from 'middlewares/validationMiddleware';

const authRoutes = express.Router();

// @route POST api/auth/login
// @desc Authenticate user using JWT
// @access Public
authRoutes.post(
  '/login',
  [
    body('email')
      .exists()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .exists()
      .withMessage('Password is required')
      .bail()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .trim()
      .escape(),

    validationMiddleware,
  ],
  loginUser
);

// @route POST api/auth/register
// @desc Register user
// @access Public
authRoutes.post(
  '/register',
  [
    body('username')
      .exists()
      .withMessage('Username is required')
      .bail()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long')
      .trim()
      .escape(),
    body('email')
      .exists()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .exists()
      .withMessage('Password is required')
      .bail()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .bail()
      .matches(/(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-zA-Z])/)
      .withMessage(
        'Password must contain at least one letter, one number, and one special character'
      )
      .trim()
      .escape(),

    validationMiddleware,
  ],
  registerUser
);

// @route GET api/auth/me
// @desc Get current logged-in user
// @access Private
authRoutes.get('/me', authMiddleware, getCurrentLoggedInUser);

export default authRoutes;
