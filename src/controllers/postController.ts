import { type Request, type Response } from 'express';
import { matchedData } from 'express-validator';

import Comment from 'models/Comment';
import Post from 'models/Post';
import User from 'models/User';

type MongooseDocumentId = string;

/**
 * Creates a new post with the content provided in the request body.
 *
 * @param {Request} req - The Express request object
 * @param {Response} res - The response object to send back the newly created post
 *
 * @returns {Promise<void>}
 */
export const createPost = async (req: Request, res: Response) => {
  try {
    const author = req.user?.id as string;
    const { content } = matchedData(req) as { content: string };

    if (!content) {
      res.sendResponse(400, 'Content is required', true);
      return;
    }

    const post = new Post({ content, author });
    await post.save();

    res.sendResponse(201, 'Post created successfully', false, post);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Retrieves posts based on the user's friends, mutual friends, likes, and comments.
 * Posts are filtered based on search criteria and sorted by creation date.
 * Pagination is applied to limit the number of posts returned.
 *
 * @param {Request} req - The Express request object containing user information and query parameters.
 * @param {Response} res - The response object to send back the retrieved posts.
 */
export const getPosts = async (req: Request, res: Response) => {
  const {
    limit = 10,
    page = 1,
    search = '',
    order = 'desc',
  } = matchedData(req) as {
    limit: number;
    page: number;
    search: string;
    order: 'desc' | 'asc';
  };

  const userId = req.user?.id as MongooseDocumentId;

  try {
    // Fetch the user's friends and mutual friends in one query
    const user = await User.findById(userId).select('friends');
    const friends = user?.friends || [];

    const mutualFriendIds = await User.find({
      friends: { $in: friends },
      _id: { $ne: userId, $nin: friends },
    }).distinct('_id');

    // Combine all user IDs to look for posts
    const relevantUserIds = [...friends, ...mutualFriendIds];

    // Fetch posts by friends, mutual friends, or where the current user has liked or commented
    let posts = await Post.find({
      $or: [
        { author: { $in: relevantUserIds } },
        { likes: userId },
        {
          comments: {
            $in: await Comment.find({ author: userId }).distinct('post'),
          },
        },
      ],
      content: { $regex: search, $options: 'i' },
    })
      .select('-likes -comments')
      .populate({
        path: 'author',
        select: ['username', '_id'],
      })
      .sort({ createdAt: order === 'desc' ? -1 : 1 })
      .skip(+limit * (page - 1))
      .limit(+limit);

    // If the found posts are less than the limit, fetch from top 20 users with most friends
    if (posts.length < limit) {
      const additionalPosts = await Post.find({
        author: {
          $in: await User.find()
            .sort({ friends: -1 })
            .limit(20)
            .distinct('_id'),
        },
        content: { $regex: search, $options: 'i' },
      })
        .select('-likes -comments')
        .populate({
          path: 'author',
          select: ['username', '_id'],
        })
        .sort({ createdAt: order === 'desc' ? -1 : 1 })
        .skip(posts.length + (page - 1) * +limit)
        .limit(+limit - posts.length);

      posts = [...posts, ...additionalPosts];
    }

    // Handle scenario when no posts found at all
    if (posts.length === 0) {
      return res.sendResponse(204, 'No posts found', false, []);
    }

    res.sendResponse(200, 'Posts retrieved successfully', false, posts);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Updates the post with the specified ID.
 *
 * @param req - The Express request object containing the post ID and update data.
 * @param res - The response object to send back the result.
 *
 * @throws {400} If the post content is empty
 * @throws {404} If the post does not exist
 *
 * @returns {200} If the post is successfully updated
 */
export const updatePost = async (req: Request, res: Response) => {
  try {
    const { content, postId } = matchedData(req) as {
      content: string;
      postId: string;
    };

    if (!content) {
      res.sendResponse(400, 'Content is required', true);
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.sendResponse(404, 'Post not found', true);
      return;
    }

    post.content = content;
    await post.save();
    res.sendResponse(200, 'Post updated successfully', false);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Deletes the post with the specified ID.
 *
 * @param req - The Express request object containing the post ID.
 * @param res - The response object to send back the result.
 *
 * @throws {404} If the post does not exist
 *
 * @returns {200} If the post is successfully deleted
 */
export const deletePost = async (req: Request, res: Response) => {
  try {
    const postId = matchedData(req).postId as MongooseDocumentId;
    const currentUser = req.user?.id as MongooseDocumentId;

    await Post.findOneAndDelete({ _id: postId, author: currentUser });
    await Comment.deleteMany({ post: postId });

    res.sendResponse(200, 'Post deleted successfully', false);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Retrieves the post with the specified ID.
 *
 * @param req - The Express request object containing the post ID.
 * @param res - The response object to send back the result.
 *
 * @throws {404} If the post does not exist
 *
 * @returns {200} If the post is successfully retrieved, along with the post DTO.
 */
export const getPostById = async (req: Request, res: Response) => {
  try {
    const postId = matchedData(req).postId as MongooseDocumentId;
    const post = await Post.findById(postId)
      .populate({
        path: 'author',
        select: ['username', '_id'],
      })
      .select('-likes -comments');
    if (!post) {
      res.sendResponse(404, 'Post not found', true);
      return;
    }
    res.sendResponse(200, 'Post retrieved successfully', false, post);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Likes the post with the specified ID.
 *
 * @param req - The Express request object containing the post ID.
 * @param res - The response object to send back the result.
 *
 * @throws {404} If the post does not exist
 *
 * @returns {200} If the post is successfully liked
 */
export const likePost = async (req: Request, res: Response) => {
  try {
    const postId = matchedData(req).postId as MongooseDocumentId;
    const userId = req.user?.id as MongooseDocumentId;

    const post = await Post.findOne({ _id: postId });
    if (!post) {
      res.sendResponse(404, 'Post not found', true);
      return;
    }

    const hasLiked = await Post.findOne({ _id: postId, likes: userId });
    if (hasLiked) {
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      res.sendResponse(200, "Post'like is removed successfully", false);
    } else {
      await Post.updateOne({ _id: postId }, { $addToSet: { likes: userId } });
      res.sendResponse(200, 'Post liked successfully', false);
    }
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Retrieves the list of users who have liked a post with the specified ID.
 *
 * @param req - The Express request object containing the post ID.
 * @param res - The response object to send back the list of users.
 *
 * @throws {404} If the post does not exist
 *
 * @returns {200} If the post is successfully retrieved, along with the list of users who have liked the post.
 */
export const getPostLikedUsers = async (req: Request, res: Response) => {
  try {
    const postId = matchedData(req).postId as MongooseDocumentId;
    const post = await Post.findById(postId)
      .select('likes')
      .populate({
        path: 'likes',
        select: ['username', '_id'],
      });
    if (!post) {
      res.sendResponse(404, 'Post not found', true);
      return;
    }
    res.sendResponse(200, 'Post retrieved successfully', false, post.likes);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};
