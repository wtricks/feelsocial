import mongoose from 'mongoose';

export interface IComment extends mongoose.Document {
  content: string;
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

type CommentModel = mongoose.Model<IComment>;

const commentSchema = new mongoose.Schema<IComment, CommentModel>(
  {
    content: { type: String, required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model<IComment, CommentModel>(
  'Comment',
  commentSchema
);
export default Comment;
