import express from 'express';
import { body, query } from 'express-validator';
import authMiddleware from 'middlewares/authMiddleware';

import {
  acceptRequest,
  getReceivedRequests,
  getSentRequests,
  getSuggestUsers,
  sendRequest,
} from 'controllers/userController';
import validationMiddleware from 'middlewares/validationMiddleware';

const userRoutes = express.Router();

// Validation middleware
const validateUserId = [
  body('userId')
    .exists()
    .withMessage('userId is required')
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
  '/users/suggestions',
  authMiddleware,
  validateGetRequests,
  getSuggestUsers
);

//  @route GET api/users
//  @desc get all sent friend requests
//  @access Private
userRoutes.get(
  '/users/sent-requests',
  authMiddleware,
  validateGetRequests,
  getSentRequests
);

//  @route GET api/users
//  @desc get all received friend requests
//  @access Private
userRoutes.get(
  '/users/received-requests',
  authMiddleware,
  validateGetRequests,
  getReceivedRequests
);

//  @route POST api/users
//  @desc Accept friend request
//  @access Private
userRoutes.post(
  '/users/accept-request',
  authMiddleware,
  validateUserId,
  acceptRequest
);

//  @route POST api/users
//  @desc Send friend request
//  @access Private
userRoutes.post(
  '/users/send-request',
  authMiddleware,
  validateUserId,
  sendRequest
);

//  @route DELETE api/users
//  @desc Cancel friend request
//  @access Private
userRoutes.delete(
  '/users/request',
  authMiddleware,
  validateUserId,
  sendRequest
);

export default userRoutes;
