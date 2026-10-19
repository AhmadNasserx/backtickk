import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '@/lib/db';
import { Bookmark } from '@/models/bookmark';
import { Comment } from '@/models/comment';
import { Community } from '@/models/community';
import { Membership } from '@/models/membership';
import { Post } from '@/models/post';
import { User } from '@/models/user';
import type { PostStatus, SessionUser, UserRole } from '@/types';

/*
 * Shared integration-test database. Starts one in-memory mongod per test file, points
 * MONGODB_URI at it and connects through lib/db.ts, so the app's own connection cache is used.
 * Set MONGOMS_SYSTEM_BINARY to reuse a local mongod binary instead of downloading one.
 */

const MODELS = [User, Community, Membership, Post, Comment, Bookmark];

let server: MongoMemoryServer | null = null;

export async function startDb(): Promise<void> {
  if (server) return;
  server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri();
  await connectDB();
  // Unique indexes back the duplicate-key guards (memberships, bookmarks, usernames), so they must exist before tests write.
  await Promise.all(MODELS.map((model) => model.init()));
}

export async function stopDb(): Promise<void> {
  await mongoose.disconnect();
  // Forget the cached connection so a later startDb() in the same worker connects afresh.
  if (globalThis.mongooseCache) {
    globalThis.mongooseCache.conn = null;
    globalThis.mongooseCache.promise = null;
  }
  await server?.stop();
  server = null;
}

/** Empties every collection but keeps indexes, so each test starts from a clean slate. */
export async function clearDb(): Promise<void> {
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
}

let sequence = 0;

function uniqueSuffix(): string {
  sequence += 1;
  return `${sequence}${randomBytes(2).toString('hex')}`;
}

export function newObjectId(): string {
  return new mongoose.Types.ObjectId().toString();
}

export interface UserOverrides {
  name?: string;
  username?: string;
  role?: UserRole;
  email?: string | null;
  image?: string | null;
  bio?: string;
  skills?: string[];
  provider?: 'github' | 'google' | 'seed';
  providerAccountId?: string;
}

/** Creates a real User document (provider 'seed' unless overridden) and returns its session view. */
export async function makeUser(overrides: UserOverrides = {}): Promise<SessionUser> {
  const suffix = uniqueSuffix();
  const created = await User.create({
    provider: overrides.provider ?? 'seed',
    providerAccountId: overrides.providerAccountId ?? `seed-${suffix}`,
    name: overrides.name ?? `Test User ${suffix}`,
    username: overrides.username ?? `user${suffix}`,
    email: overrides.email === undefined ? `user${suffix}@example.test` : (overrides.email ?? undefined),
    image: overrides.image ?? undefined,
    bio: overrides.bio ?? '',
    skills: overrides.skills ?? [],
    role: overrides.role ?? 'user',
  });
  return {
    id: created._id.toString(),
    name: created.name,
    username: created.username,
    image: created.image ?? null,
    role: created.role,
  };
}

export interface CommunityOverrides {
  name?: string;
  slug?: string;
  description?: string;
  topics?: string[];
  createdBy?: string;
}

export interface CommunityFixture {
  id: string;
  name: string;
  slug: string;
}

/** Creates a community with memberCount 0 (members are added with makeMembership). */
export async function makeCommunity(overrides: CommunityOverrides = {}): Promise<CommunityFixture> {
  const suffix = uniqueSuffix();
  const createdBy = overrides.createdBy ?? (await makeUser()).id;
  const slug = overrides.slug ?? `community-${suffix}`;
  const created = await Community.create({
    name: overrides.name ?? `Community ${suffix}`,
    slug,
    description: overrides.description ?? `Description for community ${suffix}`,
    topics: overrides.topics ?? [],
    createdBy,
    memberCount: 0,
  });
  return { id: created._id.toString(), name: created.name, slug: created.slug };
}

/** Adds a membership row and bumps memberCount, keeping the counter consistent with the rows. */
export async function makeMembership(userId: string, communityId: string): Promise<void> {
  await Membership.create({ user: userId, community: communityId });
  await Community.updateOne({ _id: communityId }, { $inc: { memberCount: 1 } });
}

export interface PostOverrides {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  status?: PostStatus;
  publishedAt?: Date;
  createdAt?: Date;
}

export interface PostFixture {
  id: string;
  slug: string;
}

/** Creates a post. Published posts get publishedAt now unless given; drafts never get one. */
export async function makePost(
  author: { id: string },
  community: { id: string },
  overrides: PostOverrides = {},
): Promise<PostFixture> {
  const suffix = uniqueSuffix();
  const status = overrides.status ?? 'published';
  const publishedAt = status === 'published' ? (overrides.publishedAt ?? new Date()) : undefined;
  const created = await Post.create({
    title: overrides.title ?? `Fixture post ${suffix}`,
    slug: overrides.slug ?? `fixture-post-${suffix}`,
    excerpt: overrides.excerpt ?? `Excerpt for post ${suffix}`,
    content: overrides.content ?? `Content for post ${suffix}, long enough to pass the schema.`,
    author: author.id,
    community: community.id,
    tags: overrides.tags ?? [],
    status,
    readingTime: 1,
    publishedAt,
  });
  if (overrides.createdAt) {
    // Set through the driver: timestamps would otherwise overwrite the value on insert.
    await Post.collection.updateOne({ _id: created._id }, { $set: { createdAt: overrides.createdAt } });
  }
  return { id: created._id.toString(), slug: created.slug };
}

export async function makeComment(
  post: { id: string },
  author: { id: string },
  content = 'A fixture comment',
  createdAt?: Date,
): Promise<string> {
  const created = await Comment.create({ post: post.id, author: author.id, content });
  if (createdAt) {
    await Comment.collection.updateOne({ _id: created._id }, { $set: { createdAt } });
  }
  return created._id.toString();
}

export async function makeBookmark(userId: string, postId: string): Promise<void> {
  await Bookmark.create({ user: userId, post: postId });
}
