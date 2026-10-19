import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface CommunityAttributes {
  name: string;
  slug: string;
  description: string;
  topics: string[];
  icon?: string;
  color?: string;
  createdBy: Types.ObjectId;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityDocument extends CommunityAttributes {
  _id: Types.ObjectId;
}

const communitySchema = new Schema<CommunityAttributes>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    topics: {
      type: [{ type: String, lowercase: true, trim: true, maxlength: 30 }],
      default: [],
      validate: [(value: string[]) => value.length <= 12, 'At most 12 topics'],
    },
    icon: { type: String, maxlength: 16 },
    color: { type: String, maxlength: 32 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    memberCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

communitySchema.index({ slug: 1 }, { unique: true });
communitySchema.index({ memberCount: -1, name: 1 });

export const Community: Model<CommunityAttributes> =
  (models.Community as Model<CommunityAttributes> | undefined) ?? model<CommunityAttributes>('Community', communitySchema);
