import { type Request, type Response } from 'express';
import mongoose from 'mongoose';

import Comment from 'models/Comment';
import Post, { type IPost } from 'models/Post';
import User, { type IUser } from 'models/User';

type MongooseDocumentId = mongoose.Types.ObjectId;

/**
 * Suggests users for the currently logged-in user based on mutual friends,
 * post interactions (likes and comments), and other recommendations.
 *
 * @param req - The Express request object containing the current logged-in user.
 * @returns Promise<mongoose.Types.ObjectId[]> - Array of suggested user IDs
 */
export const getSuggestUsers = async (req: Request, res: Response) => {
  const currentUserId = req.user?.id as MongooseDocumentId;
  const { limit = '10', page = '1' } = req.query as { [key: string]: string };

  const parsedLimit = Math.min(20, parseInt(limit, 10));
  const skipPages = parsedLimit * (parseInt(page, 10) - 1);

  const friends = (await User.findById(currentUserId))!.friends;

  const suggestedUsers: Map<
    MongooseDocumentId,
    { user: IUser; score: number }
  > = new Map();

  // Mutual friends
  const mutualFriends = await User.find({
    friends: { $in: friends },
    _id: { $ne: currentUserId, $nin: friends },
  });
  mutualFriends.forEach((user) => {
    suggestedUsers.set(user._id as MongooseDocumentId, {
      user: user,
      score: 10,
    });
  });

  // Likes on posts
  const postsLikedByCurrentUser = await Post.find({
    likes: currentUserId,
  })
    .select('author')
    .populate('author');

  postsLikedByCurrentUser.forEach((post) => {
    const authorId = (post.author as unknown as IUser)
      ._id as MongooseDocumentId;
    if (!friends.includes(authorId) && authorId !== currentUserId) {
      const existing = suggestedUsers.get(authorId) || {
        user: post.author as unknown as IUser,
        score: 5,
      };
      existing.score += 5;
      suggestedUsers.set(authorId, existing);
    }
  });

  // Comments on posts
  const commentsByCurrentUser = await Comment.find({
    author: currentUserId,
  })
    .select('post')
    .populate({
      path: 'post',
      select: 'author',
      populate: {
        path: 'author',
      },
    });

  commentsByCurrentUser.forEach((comment) => {
    const authorId = (
      (comment.post as unknown as IPost).author as unknown as IUser
    )._id as MongooseDocumentId;
    if (!friends.includes(authorId) && authorId !== currentUserId) {
      const existing = suggestedUsers.get(authorId) || {
        user: (comment.post as unknown as IPost).author as unknown as IUser,
        score: 3,
      };
      existing.score += 3;
      suggestedUsers.set(authorId, existing);
    }
  });

  if (suggestedUsers.size > 0) {
    const sortedSuggestedUsers = Array.from(suggestedUsers.values())
      .sort((a, b) => b.score - a.score)
      .map((suggested) => userDto(suggested.user))
      .slice(skipPages, skipPages + parsedLimit) as IUser[];

    return res.sendResponse(
      200,
      'Suggested users',
      false,
      sortedSuggestedUsers
    );
  }

  // If no suggestions found, fallback to random users with many friends and posts
  const fallbackUsers = await User.find()
    .sort({ 'friends.length': -1 })
    .skip(skipPages)
    .limit(parsedLimit);

  res.sendResponse(
    200,
    'Suggested users',
    false,
    fallbackUsers.map((user) => userDto(user))
  );
};

/**
 * Sends a friend request to a user.
 *
 * @param req - The request object containing the user ID to send the request to
 * @param res - The response object to send back the result
 *
 * @throws {400} If the user is already in the friends list
 * @throws {400} If the friend request has already been sent
 * @throws {404} If the user does not exist
 *
 * @returns {200} If the friend request is sent successfully
 */
export const sendRequest = async (req: Request, res: Response) => {
  const { userId } = req.body as { userId: string };
  const currentUserId = req.user?.id as MongooseDocumentId;

  const user = await User.findById(userId);
  if (!user) {
    return res.sendResponse(404, 'User not found', true);
  }

  if (user.friends.includes(currentUserId)) {
    return res.sendResponse(400, 'User is already in your friends list', true);
  }

  if (user.friendRequests.includes(currentUserId)) {
    return res.sendResponse(400, 'Friend request already sent', true);
  }

  user.friendRequests.push(currentUserId);
  await user.save();

  res.sendResponse(200, 'Friend request sent', false);
};

/**
 * Removes a user from the current user's friends list.
 *
 * @param req - The request object containing the user ID to remove
 * @param res - The response object to send back the result
 *
 * @throws {400} If the user is not in the friends list
 * @throws {404} If the user does not exist
 *
 * @returns {200} If the user is successfully removed
 */
export const removeFriend = async (req: Request, res: Response) => {
  const { userId } = req.body as { userId: MongooseDocumentId };
  const currentUserId = req.user?.id as MongooseDocumentId;

  const user = await User.findById(userId);
  if (!user) {
    return res.sendResponse(404, 'User not found', true);
  }

  const currentUser = (await User.findById(currentUserId))!;

  if (!user.friends.includes(currentUserId)) {
    return res.sendResponse(400, 'User is not in your friends list', true);
  }

  currentUser.friends = currentUser.friends.filter(
    (friendId) => friendId !== userId
  );
  user.friends = user.friends.filter((friendId) => friendId !== currentUserId);
  await currentUser.save();
  await user.save();

  res.sendResponse(200, 'Friend removed', false);
};

/**
 * Accepts a friend request from a user.
 *
 * @param req - The request object containing the user ID to accept
 * @param res - The response object to send back the result
 *
 * @throws {400} If the friend request does not exist
 * @throws {404} If the user does not exist
 *
 * @returns {200} If the friend request is successfully accepted
 */
export const acceptRequest = async (req: Request, res: Response) => {
  const { userId } = req.body as { userId: MongooseDocumentId };
  const currentUserId = req.user?.id as MongooseDocumentId;

  const user = await User.findById(userId);
  if (!user) {
    return res.sendResponse(404, 'User not found', true);
  }

  const currentUser = (await User.findById(currentUserId))!;
  if (!currentUser.friendRequests.includes(userId)) {
    return res.sendResponse(400, 'Friend request not found', true);
  }

  currentUser.friends.push(userId);
  user.friends.push(currentUserId);
  currentUser.friendRequests = currentUser.friendRequests.filter(
    (friendId) => friendId !== userId
  );
  user.friendRequests = user.friendRequests.filter(
    (friendId) => friendId !== currentUserId
  );
  await currentUser.save();
  await user.save();

  res.sendResponse(200, 'Friend request accepted', false);
};

/**
 * Retrieves the list of friends for the current user based on the specified query parameters.
 *
 * @param req - The Express request object containing user information and query parameters.
 * @param res - The response object to send back the list of friends.
 */
export const getFriendsList = async (req: Request, res: Response) => {
  const userId = req.user?.id as MongooseDocumentId;
  const {
    limit = '10',
    page = '1',
    search = '',
    sort = 'desc',
  } = req.query as { [key: string]: string };

  const parsedLimit = Math.min(20, parseInt(limit, 10));
  const skipPages = parsedLimit * (parseInt(page, 10) - 1);
  const sortingOrder = { createdAt: sort === 'desc' ? -1 : 1 };

  const currentUser = await User.findById(userId)
    .select('friends')
    .populate({
      path: 'friends',
      match: {
        username: { $regex: search, $options: 'i' },
      },
      options: {
        limit: parsedLimit,
        skip: skipPages,
        sort: sortingOrder,
      },
    });

  const friendsList = ((currentUser?.friends as unknown as IUser[]) || []).map(
    userDto
  );

  res.sendResponse(200, 'Friends', false, friendsList);
};

/**
 * Retrieves the list of friend requests received by the current user based on specified query parameters.
 *
 * @param req - The Express request object containing user information and query parameters.
 * @param res - The response object to send back the list of friend requests.
 */
export const getReceivedRequests = async (req: Request, res: Response) => {
  const userId = req.user?.id as MongooseDocumentId;
  const {
    limit = '10',
    page = '1',
    search = '',
    sort = 'desc',
  } = req.query as { [key: string]: string };

  const parsedLimit = Math.min(20, parseInt(limit, 10));
  const skipPages = parsedLimit * (parseInt(page, 10) - 1);
  const sortingOrder = { createdAt: sort === 'desc' ? -1 : 1 };

  const currentUser = await User.findById(userId)
    .select('friendRequests')
    .populate({
      path: 'friendRequests',
      match: {
        username: { $regex: search, $options: 'i' },
      },
      options: {
        limit: parsedLimit,
        skip: skipPages,
        sort: sortingOrder,
      },
    });

  const requestsList = (
    (currentUser?.friendRequests as unknown as IUser[]) || []
  ).map(userDto);

  res.sendResponse(200, 'Friend requests', false, requestsList);
};

/**
 * Retrieves the list of friend requests sent by the current user based on specified query parameters.
 *
 * @param req - The Express request object containing user information and query parameters.
 * @param res - The response object to send back the list of friend requests.
 */
export const getSentRequests = async (req: Request, res: Response) => {
  const userId = req.user?.id as MongooseDocumentId;
  const {
    limit = '10',
    page = '1',
    search = '',
    sort = 'desc',
  } = req.query as { [key: string]: string };

  const parsedLimit = Math.min(20, parseInt(limit, 10));
  const skipPages = parsedLimit * (parseInt(page, 10) - 1);

  const usersList = await User.find({
    friendRequests: userId,
    username: { $regex: search, $options: 'i' },
  })
    .skip(skipPages)
    .limit(parsedLimit)
    .sort({ createdAt: sort === 'desc' ? -1 : 1 });

  const requestsList = usersList.map(userDto);

  res.sendResponse(200, 'Friend requests', false, requestsList);
};

/**
 * Converts a {@link IUser} object to a simplified data transfer object.
 * @param {IUser} user The user to convert.
 * @returns {Object} The user DTO with the following properties:
 *   - `_id`: The ID of the user.
 *   - `username`: The username of the user.
 *   - `email`: The email address of the user.
 *   - `createdAt`: The date and time the user was created.
 */
const userDto = (user: IUser): object => {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
};
