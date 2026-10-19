import { Schema, model, models, type Model, type Types } from 'mongoose';
import { USER_PROVIDERS, USER_ROLES, type UserProvider, type UserRole } from '@/types';

export interface UserAttributes {
  provider: UserProvider;
  providerAccountId: string;
  name: string;
  email?: string;
  image?: string;
  username: string;
  bio: string;
  skills: string[];
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends UserAttributes {
  _id: Types.ObjectId;
}

const userSchema = new Schema<UserAttributes>(
  {
    provider: { type: String, enum: USER_PROVIDERS, required: true },
    providerAccountId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, maxlength: 320 },
    image: { type: String, maxlength: 2048 },
    username: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 30 },
    bio: { type: String, default: '', maxlength: 280 },
    skills: {
      type: [{ type: String, trim: true, maxlength: 30 }],
      default: [],
      validate: [(value: string[]) => value.length <= 15, 'At most 15 skills'],
    },
    role: { type: String, enum: USER_ROLES, default: 'user' },
  },
  { timestamps: true },
);

userSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

export const User: Model<UserAttributes> = (models.User as Model<UserAttributes> | undefined) ?? model<UserAttributes>('User', userSchema);
