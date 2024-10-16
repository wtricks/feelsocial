import { type Request, type Response } from 'express';
import { matchedData } from 'express-validator';

import Comment from 'models/Comment';
import Post from 'models/Post';

/**
 * Creates a new comment with the content provided in the request body,
 * and associates it with the post specified by the postId parameter.
 * If the post does not exist, a 404 error is returned.
 * If any other error occurs, a 500 error is returned.
 * @param {Request} req - The Express request object
 * @param {Response} res - The response object to send back the comment
 * @returns {Promise<void>}
 */
export const createComment = async (req: Request, res: Response) => {
  const { content, postId } = matchedData(req) as {
    content: string;
    postId: string;
  };

  if (!content) {
    res.sendResponse(400, 'Content is required', true);
    return;
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      res.sendResponse(404, 'Post not found', true);
      return;
    }

    const comment = new Comment({
      content,
      author: req.user?.id,
      post: postId,
    });
    await comment.save();
    res.sendResponse(201, 'Comment created successfully', false, comment);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Retrieves comments for a given post based on the query parameters.
 * If any error occurs, a 500 error is returned.
 * @param {Request} req - The Express request object
 * @param {Response} res - The response object to send back the comments
 * @returns {Promise<void>}
 */
export const getComments = async (req: Request, res: Response) => {
  const { postId } = matchedData(req) as { postId: string };
  const {
    page = 1,
    limit = 10,
    order = 'desc',
  } = matchedData(req) as {
    page: number;
    limit: number;
    order: 'desc' | 'asc';
  };

  try {
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.sendResponse(200, 'Comments fetched successfully', false, comments);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Deletes the comment with the specified ID.
 *
 * @param {Request} req - The Express request object containing the comment ID.
 * @param {Response} res - The response object to send back the result.
 *
 * @throws {404} If the comment does not exist
 *
 * @returns {200} If the comment is successfully deleted
 */
export const deleteComment = async (req: Request, res: Response) => {
  const { commentId } = matchedData(req) as { commentId: string };
  try {
    await Comment.findByIdAndDelete(commentId);
    res.sendResponse(200, 'Comment deleted successfully', false);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Updates the content of an existing comment with the specified ID.
 *
 * @param {Request} req - The Express request object containing the comment ID and updated content.
 * @param {Response} res - The response object to send back the result.
 *
 * @throws {404} If the comment does not exist
 *
 * @returns {200} If the comment is successfully updated, along with the updated comment.
 */
export const updateComment = async (req: Request, res: Response) => {
  const { commentId, content } = matchedData(req) as {
    commentId: string;
    content: string;
  };

  if (!content) {
    return res.sendResponse(400, 'Content is required', true);
  }

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.sendResponse(404, 'Comment not found', true);
    }
    comment.content = content || comment.content;
    await comment.save();
    res.sendResponse(200, 'Comment updated successfully', false, comment);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};
