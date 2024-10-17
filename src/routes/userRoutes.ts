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
  rejectFriendRequest,
  removeFriend,
  removeFriendRequest,
  sendRequest,
  updateUserById,
} from 'controllers/userController';
import validationMiddleware from 'middlewares/validationMiddleware';

const userRoutes = express.Router();

const validateParamUserId = [
  param('userId').isMongoId().withMessage('Invalid userId format').escape(),
  validationMiddleware,
];

const validateGetRequests = [
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive integer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .escape(),
  query('order')
    .optional()
    .isString()
    .withMessage('Order must be a string')
    .bail()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either "asc" or "desc"'),
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
  '/accept-request/:userId',
  authMiddleware,
  validateParamUserId,
  acceptRequest
);

//  @route POST api/users
//  @desc Send friend request
//  @access Private
userRoutes.post(
  '/send-request/:userId',
  authMiddleware,
  validateParamUserId,
  sendRequest
);

//  @route DELETE api/users
//  @desc Cancel friend request
//  @access Private
userRoutes.delete(
  '/request/:userId',
  authMiddleware,
  validateParamUserId,
  removeFriendRequest
);

//  @route DELETE api/users
//  @desc Remove friend
//  @access Private
userRoutes.delete(
  '/friend/:userId',
  authMiddleware,
  validateParamUserId,
  removeFriend
);

//  @route DELETE api/users
//  @desc Reject friend request
//  @access Private
userRoutes.post(
  '/reject-request/:userId',
  authMiddleware,
  validateParamUserId,
  rejectFriendRequest
);

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
userRoutes.get('/:userId', authMiddleware, validateParamUserId, getUserById);

export default userRoutes;
