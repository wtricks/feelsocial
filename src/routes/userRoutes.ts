import express from 'express';
import { body, param, query } from 'express-validator';
import authMiddleware from 'middlewares/authMiddleware';

import {
  acceptRequest,
  getFriendsList,
  getReceivedRequests,
  getSentRequests,
  getSuggestUsers,
  getUserById,
  removeFriend,
  removeFriendRequest,
  sendRequest,
  updateUserById,
} from 'controllers/userController';
import validationMiddleware from 'middlewares/validationMiddleware';

const userRoutes = express.Router();

// Validation middleware
const validateUserId = [
  body('userId')
    .exists()
    .withMessage('userId is required')
    .bail()
    .isMongoId()
    .withMessage('Invalid userId format'),
  validationMiddleware,
];

const validateGetRequests = [
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive integer'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  validationMiddleware,
];

//  @route GET api/users
//  @desc Get all suggested users
//  @access Private
userRoutes.get(
  '/suggestions',
  authMiddleware,
  validateGetRequests,
  getSuggestUsers
);

//  @route GET api/users
//  @desc get all sent friend requests
//  @access Private
userRoutes.get(
  '/sent-requests',
  authMiddleware,
  validateGetRequests,
  getSentRequests
);

//  @route GET api/users
//  @desc get all received friend requests
//  @access Private
userRoutes.get(
  '/received-requests',
  authMiddleware,
  validateGetRequests,
  getReceivedRequests
);

//  @route GET api/users
//  @desc Get friends list
//  @access Private
userRoutes.get('/friends', authMiddleware, getFriendsList);

//  @route POST api/users
//  @desc Accept friend request
//  @access Private
userRoutes.post(
  '/accept-request',
  authMiddleware,
  validateUserId,
  acceptRequest
);

//  @route POST api/users
//  @desc Send friend request
//  @access Private
userRoutes.post('/send-request', authMiddleware, validateUserId, sendRequest);

//  @route DELETE api/users
//  @desc Cancel friend request
//  @access Private
userRoutes.delete(
  '/request',
  authMiddleware,
  validateUserId,
  removeFriendRequest
);

//  @route DELETE api/users
//  @desc Remove friend
//  @access Private
userRoutes.delete('/friend', authMiddleware, validateUserId, removeFriend);

userRoutes.put(
  '/',
  authMiddleware,
  [
    body('username')
      .optional()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long')
      .trim()
      .escape(),

    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    validationMiddleware,
  ],
  updateUserById
);

//  @route GET api/users
//  @desc Get user by ID
//  @access Private
userRoutes.get(
  '/:userId',
  authMiddleware,
  [
    param('userId')
      .exists()
      .withMessage('userId is required')
      .bail()
      .isMongoId()
      .withMessage('Invalid userId format'),
    validationMiddleware,
  ],
  getUserById
);

export default userRoutes;
