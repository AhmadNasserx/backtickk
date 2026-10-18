import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface BookmarkAttributes {
  user: Types.ObjectId;
  post: Types.ObjectId;
  createdAt: Date;
}

export interface BookmarkDocument extends BookmarkAttributes {
  _id: Types.ObjectId;
}

/* Own collection: supports both "all bookmarks of a user" and "is this post bookmarked by this user". */
const bookmarkSchema = new Schema<BookmarkAttributes>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

export const Bookmark: Model<BookmarkAttributes> =
  (models.Bookmark as Model<BookmarkAttributes> | undefined) ?? model<BookmarkAttributes>('Bookmark', bookmarkSchema);
