import { type Request, type Response } from 'express';
import { matchedData } from 'express-validator';
import mongoose from 'mongoose';

import User, { type IUser } from 'models/User';

type MongooseDocumentId = mongoose.Types.ObjectId;

/**
 * Retrieves suggested users based on mutual friends, liked posts, and commented posts.
 *
 * @param req - The Express request object containing user information and query parameters.
 * @param res - The response object to send back the suggested users.
 * @returns {200} If suggested users are successfully retrieved, along with the user DTOs.
 */
export const getSuggestUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id as MongooseDocumentId;
    const { limit = 10, page = 1 } = matchedData(req) as {
      limit: number;
      page: number;
    };

    const friends = (await User.findById(currentUserId))!.friends;
    const suggestedUsers = await User.aggregate([
      {
        $facet: {
          // Find mutual friends
          mutualFriends: [
            {
              $match: {
                friends: { $in: friends },
                friendRequests: { $ne: currentUserId },
                _id: { $ne: currentUserId, $nin: friends },
              },
            },
            { $addFields: { score: { $literal: 10 } } },
          ],
          // Find users who liked the same posts
          likedPosts: [
            {
              $lookup: {
                from: 'posts',
                localField: '_id',
                foreignField: 'author',
                as: 'postsLikedByCurrentUser',
              },
            },
            {
              $match: {
                'postsLikedByCurrentUser.likes': currentUserId,
                _id: { $ne: currentUserId, $nin: friends },
                friendRequests: { $ne: currentUserId },
              },
            },
            { $addFields: { score: { $literal: 5 } } },
          ],
          // Find users who commented on the same posts
          commentedPosts: [
            {
              $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'author',
                as: 'commentsByCurrentUser',
              },
            },
            {
              $match: {
                'commentsByCurrentUser.author': currentUserId,
                _id: { $ne: currentUserId, $nin: friends },
                friendRequests: { $ne: currentUserId },
              },
            },
            { $addFields: { score: { $literal: 3 } } },
          ],
        },
      },
      // Merge the results into one array
      {
        $project: {
          suggestedUsers: {
            $concatArrays: ['$mutualFriends', '$likedPosts', '$commentedPosts'],
          },
        },
      },
      { $unwind: '$suggestedUsers' },
      // Group by user id to avoid duplicates and sum scores
      {
        $group: {
          _id: '$suggestedUsers._id',
          user: { $first: '$suggestedUsers' },
          score: { $sum: '$suggestedUsers.score' },
        },
      },
      {
        $addFields: {
          friendsCount: { $size: '$user.friends' },
        },
      },
      {
        $project: {
          'user.friends': 0,
          'user.friendRequests': 0,
        },
      },
      // Sort by score
      { $sort: { score: -1 } },
      // Apply pagination
      { $skip: +limit * (page - 1) },
      { $limit: +limit },
    ]);

    const fetchedUsersCount = (page - 1) * limit;
    const remaining = limit - suggestedUsers.length;

    if (remaining > 0) {
      const randomUsers = await User.aggregate([
        {
          $match: {
            _id: { $ne: new mongoose.Types.ObjectId(currentUserId) },
            friendRequests: { $ne: new mongoose.Types.ObjectId(currentUserId) },
          },
        },
        {
          $addFields: {
            friendsCount: { $size: '$friends' },
          },
        },
        {
          $project: {
            friends: 0,
            friendRequests: 0,
            password: 0,
          },
        },
        {
          $sort: { friendsCount: -1 },
        },
        {
          $skip: Math.max(fetchedUsersCount - suggestedUsers.length, 0),
        },
        {
          $limit: remaining,
        },
      ]);

      return res.sendResponse(200, 'Suggested users', false, [
        ...suggestedUsers.map(({ user }) => user),
        ...randomUsers,
      ]);
    }

    res.sendResponse(200, 'Suggested users', false, suggestedUsers);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Sends a friend request to the given user
 * @param req - The request object containing user information and the user to send the friend request to
 * @param res - The response object to send back the result of the operation
 * @throws {ForbiddenError} If the user is already in the current user's friends list or if a friend request has already been sent
 */
export const sendRequest = async (req: Request, res: Response) => {
  try {
    const { userId } = matchedData(req) as { userId: string };
    const currentUserId = req.user?.id as MongooseDocumentId;

    const user = await User.findOne({
      $or: [
        { _id: userId, friendRequests: currentUserId },
        { _id: userId, friends: currentUserId },
      ],
    });

    if (user || !(await User.findById(userId))) {
      return res.sendResponse(
        403,
        'Either user is already in your friends list or a friend request has already been sent',
        true
      );
    }

    await User.updateOne(
      { _id: userId },
      { $addToSet: { friendRequests: currentUserId } }
    );

    res.sendResponse(200, 'Friend request sent', false);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Removes a friend from the current user's friends list.
 *
 * @param req - The request object containing user information and the friend to be removed
 * @param res - The response object to send back the result of removing the friend
 */
export const removeFriend = async (req: Request, res: Response) => {
  try {
    const { userId } = matchedData(req) as { userId: MongooseDocumentId };
    const currentUserId = req.user?.id as MongooseDocumentId;

    const user = await User.findOne({ _id: userId, friends: currentUserId });
    if (!user) {
      return res.sendResponse(400, 'User is not in your friends list', true);
    }

    await User.updateOne(
      { _id: currentUserId },
      { $pull: { friends: userId } }
    );
    await User.updateOne(
      { _id: userId },
      { $pull: { friends: currentUserId } }
    );

    res.sendResponse(200, 'Friend removed', false);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Removes a friend request from the user's friend requests list.
 *
 * @param req - The request object containing user information and the friend request to be removed
 * @param res - The response object to send back the result of removing the friend request
 */
export const removeFriendRequest = async (req: Request, res: Response) => {
  try {
    const { userId } = matchedData(req) as { userId: MongooseDocumentId };
    const currentUser = req.user?.id as MongooseDocumentId;

    const user = await User.findOne({
      _id: userId,
      friendRequests: currentUser,
    });
    if (!user) {
      return res.sendResponse(400, 'Friend request not found', true);
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { friendRequests: currentUser } }
    );
    res.sendResponse(200, 'Friend request removed', false);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Accepts a friend request from a user.
 *
 * @param req - The request object containing the user who sent the friend request
 * @param res - The response object to send back the result of accepting the friend request
 *
 * @throws {400} If the friend request does not exist
 *
 * @returns {200} If the friend request is successfully accepted
 */
export const acceptRequest = async (req: Request, res: Response) => {
  try {
    const { userId } = matchedData(req) as { userId: MongooseDocumentId };
    const currentUserId = req.user?.id as MongooseDocumentId;

    const user = await User.findOne({
      _id: currentUserId,
      friendRequests: userId,
    });
    if (!user) {
      return res.sendResponse(400, 'Friend request not found', true);
    }

    await User.updateOne(
      { _id: currentUserId },
      { $addToSet: { friends: userId }, $pull: { friendRequests: userId } }
    );
    await User.updateOne(
      { _id: userId },
      {
        $addToSet: { friends: currentUserId },
        $pull: { friendRequests: currentUserId },
      }
    );

    res.sendResponse(200, 'Friend request accepted', false);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Retrieves the list of friends for the current user based on specified query parameters.
 *
 * @param req - The Express request object containing user information and query parameters.
 * @param res - The response object to send back the list of friends.
 * @returns {200} If the friends are successfully retrieved, along with the user DTOs.
 */
export const getFriendsList = async (req: Request, res: Response) => {
  try {
    const userId = (matchedData(req).userId ||
      req.user?.id) as MongooseDocumentId;
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

    const currentUser = await User.findById(userId)
      .select('friends')
      .populate({
        path: 'friends',
        select: ['-friendRequests'],
        match: {
          username: { $regex: search, $options: 'i' },
        },
        options: {
          limit: +limit,
          skip: +limit * (page - 1),
          sort: {
            createdAt: order === 'desc' ? -1 : 1,
          },
        },
      });

    const friendsList = (
      (currentUser?.friends as unknown as IUser[]) || []
    ).map((friend) => {
      return {
        ...friend.toJSON(),
        friendsCount: friend.friends.length,
        friends: undefined,
      };
    });

    res.sendResponse(200, 'Friends', false, friendsList);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Retrieves the list of friend requests received by the current user based on specified query parameters.
 *
 * @param req - The Express request object containing user information and query parameters.
 * @param res - The response object to send back the list of friend requests.
 */
export const getReceivedRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as MongooseDocumentId;
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

    const currentUser = await User.findById(userId)
      .select('friendRequests')
      .populate({
        path: 'friendRequests',
        select: ['-friendRequests'],
        match: {
          username: { $regex: search, $options: 'i' },
        },
        options: {
          limit: +limit,
          skip: +limit * (page - 1),
          sort: {
            createdAt: order === 'desc' ? -1 : 1,
          },
        },
      });

    const requestsList = (
      (currentUser?.friendRequests as unknown as IUser[]) || []
    ).map((friend) => {
      return {
        ...friend.toJSON(),
        friendsCount: friend.friends.length,
        friends: undefined,
      };
    });

    res.sendResponse(200, 'Friend requests', false, requestsList);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Retrieves the list of friend requests sent by the current user based on specified query parameters.
 *
 * @param req - The Express request object containing user information and query parameters.
 * @param res - The response object to send back the list of friend requests.
 */
export const getSentRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as MongooseDocumentId;
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

    const usersList = await User.find({
      friendRequests: userId,
      username: { $regex: search, $options: 'i' },
    })
      .select(['-friendRequests'])
      .skip(+limit * (page - 1))
      .limit(+limit)
      .sort({ createdAt: order === 'desc' ? -1 : 1 });

    res.sendResponse(
      200,
      'Friend requests',
      false,
      usersList.map((friend) => {
        return {
          ...friend.toJSON(),
          friendsCount: friend.friends.length,
          friends: undefined,
        };
      })
    );
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Updates the user with the specified ID.
 *
 * @param req - The Express request object containing the user ID and update data.
 * @param res - The response object to send back the result.
 *
 * @throws {404} If the user does not exist
 *
 * @returns {200} If the user is successfully updated
 */
export const updateUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as MongooseDocumentId;
    const { email, username } = matchedData(req) as {
      email: string;
      username: string;
    };

    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.sendResponse(409, 'Username or email already exists', true);
    }

    const currentUser = (await User.findById(userId))!;
    currentUser.username = username || currentUser.username;
    currentUser.email = email || currentUser.email;

    await currentUser.save();
    res.sendResponse(200, 'User updated', false);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Retrieves a user by ID.
 *
 * @param req - The Express request object containing the user ID as a parameter.
 * @param res - The response object to send back the user information.
 *
 * @throws {404} If the user does not exist
 *
 * @returns {200} If the user is successfully retrieved
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = matchedData(req) as { userId: MongooseDocumentId };
    const user = await User.findById(userId).select(['-friendRequests']);

    if (!user) {
      return res.sendResponse(404, 'User not found', true);
    }

    res.sendResponse(200, 'User found', false, {
      ...user.toJSON(),
      friendsCount: user.friends.length,
      friends: undefined,
    });
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};

/**
 * Rejects a friend request from another user.
 *
 * @param req - The Express request object containing the ID of the user who sent the friend request.
 * @param res - The response object to send back the result of rejecting the friend request.
 *
 * @throws {400} If the friend request does not exist
 *
 * @returns {200} If the friend request is successfully rejected
 */
export const rejectFriendRequest = async (req: Request, res: Response) => {
  try {
    const { userId } = matchedData(req) as { userId: MongooseDocumentId };
    const currentUserId = req.user?.id as MongooseDocumentId;

    const user = await User.findOne({
      _id: currentUserId,
      friendRequests: userId,
    });
    if (!user) {
      return res.sendResponse(400, 'Friend request not found', true);
    }

    await User.updateOne(
      { _id: currentUserId },
      { $pull: { friendRequests: userId } }
    );

    res.sendResponse(200, 'Friend request rejected', false);
  } catch (error) {
    console.log(error);
    res.sendResponse(500, 'Internal server error', true);
  }
};
