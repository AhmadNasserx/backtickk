import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface CommentAttributes {
  post: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentDocument extends CommentAttributes {
  _id: Types.ObjectId;
}

/* Separate collection: comments grow without bound, are paginated and deleted on their own. */
const commentSchema = new Schema<CommentAttributes>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, createdAt: 1 });

export const Comment: Model<CommentAttributes> =
  (models.Comment as Model<CommentAttributes> | undefined) ?? model<CommentAttributes>('Comment', commentSchema);
