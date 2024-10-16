import express from 'express';
import { body, param } from 'express-validator';

import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from 'controllers/commentController';
import authMiddleware from 'middlewares/authMiddleware';
import validationMiddleware from 'middlewares/validationMiddleware';

const commentRouts = express.Router();

const validateContent = [
  body('content')
    .exists()
    .withMessage('Content is required')
    .bail()
    .isString()
    .withMessage('Content must be a string')
    .bail(),

  validationMiddleware,
];

const validateCommentParam = [
  param('commentId').isMongoId().withMessage('Invalid postId format'),
  validationMiddleware,
];

const validatePostParam = [
  param('postId').isMongoId().withMessage('Invalid postId format'),
  validationMiddleware,
];

//  @route GET api/comments
//  @desc Get comments
//  @access Private
commentRouts.get('/:postId', authMiddleware, validatePostParam, getComments);

//  @route PUT api/comments
//  @desc Update comment
//  @access Private
commentRouts.put(
  '/:commentId',
  authMiddleware,
  validateCommentParam,
  validateContent,
  updateComment
);

//  @route POST api/comments
//  @desc Create comment
//  @access Private
commentRouts.post(
  '/:postId',
  authMiddleware,
  validateContent,
  validatePostParam,
  createComment
);

//  @route DELETE api/comments
commentRouts.delete(
  '/:commentId',
  authMiddleware,
  validateCommentParam,
  deleteComment
);

export default commentRouts;
