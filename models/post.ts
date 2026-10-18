import { Schema, model, models, type Model, type Types } from 'mongoose';
import { POST_STATUSES, type PostStatus } from '@/types';

export interface PostAttributes {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: Types.ObjectId;
  community: Types.ObjectId;
  tags: string[];
  status: PostStatus;
  readingTime: number;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostDocument extends PostAttributes {
  _id: Types.ObjectId;
}

const postSchema = new Schema<PostAttributes>(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 160 },
    excerpt: { type: String, required: true, trim: true, maxlength: 240 },
    content: { type: String, required: true, minlength: 20, maxlength: 20000 },
    coverImage: { type: String, maxlength: 2048 },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    tags: {
      type: [{ type: String, lowercase: true, trim: true, maxlength: 30 }],
      default: [],
      validate: [(value: string[]) => value.length <= 5, 'At most 5 tags'],
    },
    status: { type: String, enum: POST_STATUSES, default: 'published' },
    readingTime: { type: Number, required: true, min: 1 },
    publishedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Each index backs a specific query; keep them in sync with lib/data/posts.ts.
postSchema.index({ slug: 1 }, { unique: true });
postSchema.index({ community: 1, status: 1, publishedAt: -1 });
postSchema.index({ author: 1, status: 1, publishedAt: -1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1, status: 1, publishedAt: -1 });

export const Post: Model<PostAttributes> = (models.Post as Model<PostAttributes> | undefined) ?? model<PostAttributes>('Post', postSchema);
