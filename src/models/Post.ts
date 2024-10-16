import mongoose from 'mongoose';

export interface IPost {
  content: string;
  author: typeof mongoose.Schema.Types.ObjectId;
  likes: (typeof mongoose.Schema.Types.ObjectId)[];
  comments: (typeof mongoose.Schema.Types.ObjectId)[];

  createdAt: Date;
  updatedAt: Date;
}

interface IPostMethods {
  addLike(userId: typeof mongoose.Schema.Types.ObjectId): Promise<boolean>;
  removeLike(userId: typeof mongoose.Schema.Types.ObjectId): Promise<boolean>;
  isLiked(userId: typeof mongoose.Schema.Types.ObjectId): Promise<boolean>;
}

type PostModel = mongoose.Model<IPost, object, IPostMethods>;

const postSchema = new mongoose.Schema<IPost, PostModel, IPostMethods>(
  {
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  { timestamps: true }
);

/**
 * Adds a like to a post
 * @param userId - The ID of the user that liked the post
 * @returns {Promise<boolean>} Whether the like was successfully added
 */
postSchema.methods.addLike = async function (
  userId: typeof mongoose.Schema.Types.ObjectId
): Promise<boolean> {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    await this.save();
    return true;
  }
  return false;
};

/**
 * Remove a like from a post
 * @param userId - The ID of the user whose like to remove
 * @returns {Promise<boolean>} Whether the like was successfully removed
 */
postSchema.methods.removeLike = async function (
  userId: typeof mongoose.Schema.Types.ObjectId
): Promise<boolean> {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
    await this.save();
    return true;
  }
  return false;
};

/**
 * Checks if a user has liked a post
 * @param userId - The ID of the user
 * @param postId - The ID of the post
 * @returns {Promise<import('mongoose').Document | null>} The post if the user has liked it, `null` otherwise
 */
postSchema.statics.isLiked = async function (
  userId: typeof mongoose.Schema.Types.ObjectId,
  postId: typeof mongoose.Schema.Types.ObjectId
): Promise<import('mongoose').Document | null> {
  return this.findOne({ likes: userId, _id: postId });
};

const Post = mongoose.model<IPost, PostModel>('Post', postSchema);
export default Post;
