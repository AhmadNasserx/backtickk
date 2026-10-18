import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface MembershipAttributes {
  user: Types.ObjectId;
  community: Types.ObjectId;
  createdAt: Date;
}

export interface MembershipDocument extends MembershipAttributes {
  _id: Types.ObjectId;
}

/* Own collection: a community can have unbounded members, so they are not embedded. */
const membershipSchema = new Schema<MembershipAttributes>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

membershipSchema.index({ user: 1, community: 1 }, { unique: true });
membershipSchema.index({ community: 1 });

export const Membership: Model<MembershipAttributes> =
  (models.Membership as Model<MembershipAttributes> | undefined) ??
  model<MembershipAttributes>('Membership', membershipSchema);
