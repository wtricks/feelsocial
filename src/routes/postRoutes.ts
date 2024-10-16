import express from 'express';
import { body, param, query } from 'express-validator';

import {
  createPost,
  deletePost,
  getPostById,
  getPostLikedUsers,
  getPosts,
  likePost,
  updatePost,
} from 'controllers/postController';
import authMiddleware from 'middlewares/authMiddleware';
import validationMiddleware from 'middlewares/validationMiddleware';

const postRoutes = express.Router();

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

const validateParamPostId = [
  param('postId').isMongoId().withMessage('Invalid postId format'),
  validationMiddleware,
];

const validateContent = [
  body('content')
    .exists()
    .withMessage('Content is required')
    .bail()
    .isString()
    .withMessage('Content must be a string'),
  validationMiddleware,
];

//  @route GET api/posts
//  @desc Get posts
//  @access Private
postRoutes.get('/', authMiddleware, validateGetRequests, getPosts);

//  @route GET api/posts
//  @desc Get post by ID
//  @access Private
postRoutes.get('/:postId', authMiddleware, validateParamPostId, getPostById);

//  @route POST api/posts
//  @desc Create new post
//  @access Private
postRoutes.post('/', authMiddleware, validateContent, createPost);

//  @route PUT api/posts
//  @desc Update post
//  @access Private
postRoutes.put(
  '/:postId',
  authMiddleware,
  validateParamPostId,
  validateContent,
  updatePost
);

//  @route DELETE api/posts
//  @desc Delete post
//  @access Private
postRoutes.delete('/:postId', authMiddleware, validateParamPostId, deletePost);

//  @route GET api/posts
//  @desc Get post by ID
//  @access Private
postRoutes.get(
  '/like/:postId',
  authMiddleware,
  validateParamPostId,
  getPostLikedUsers
);

//  @route POST api/posts
//  @desc Like post
//  @access Private
postRoutes.post('/like/:postId', authMiddleware, validateParamPostId, likePost);

export default postRoutes;
