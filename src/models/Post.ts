import mongoose from 'mongoose';

export interface IPost {
  content: string;
  author: typeof mongoose.Schema.Types.ObjectId;
  likes: (typeof mongoose.Schema.Types.ObjectId)[];
  comments: (typeof mongoose.Schema.Types.ObjectId)[];

  createdAt: Date;
  updatedAt: Date;
}

type PostModel = mongoose.Model<IPost, object>;

const postSchema = new mongoose.Schema<IPost, PostModel>(
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

const Post = mongoose.model<IPost, PostModel>('Post', postSchema);
export default Post;
