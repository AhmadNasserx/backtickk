/*
 * Usage: tsx --env-file=.env.local scripts/seed.ts [--reset]
 *
 * Upserts the seed content from data/seed.ts. Re-running it updates the same records
 * instead of duplicating them. --reset first deletes only seed users and their content.
 */
import mongoose, { type QueryOptions, type Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { readingTime, slugify } from '@/lib/slug';
import { Bookmark } from '@/models/bookmark';
import { Comment } from '@/models/comment';
import { Community } from '@/models/community';
import { Membership } from '@/models/membership';
import { Post } from '@/models/post';
import { User } from '@/models/user';
import {
  SEED_BOOKMARKS,
  SEED_COMMENTS,
  SEED_COMMUNITIES,
  SEED_MEMBERSHIPS,
  SEED_POSTS,
  SEED_PROVIDER,
  SEED_USERS,
} from '@/data/seed';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MIN_MEMBERSHIPS_PER_USER = 2;
const MAX_MEMBERSHIPS_PER_USER = 4;

/* Timestamps come from the seed data, not from the clock, so reruns on the same day write identical dates. */
interface Clock {
  now: Date;
  startOfDay: Date;
}

interface PostRef {
  id: Types.ObjectId;
  publishedAt: Date;
}

const UPSERT: QueryOptions = {
  upsert: true,
  returnDocument: 'after',
  runValidators: true,
  setDefaultsOnInsert: true,
  timestamps: false,
};

function currentClock(): Clock {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { now, startOfDay };
}

function daysBefore(clock: Clock, days: number): Date {
  return new Date(clock.startOfDay.getTime() - days * DAY_MS);
}

function notInFuture(date: Date, now: Date): Date {
  return date.getTime() > now.getTime() ? now : date;
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function mustGet<V>(map: Map<string, V>, key: string, label: string): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Unknown ${label} "${key}"`);
  return value;
}

function requireDocument<T extends { _id: Types.ObjectId }>(doc: T | null, label: string): T {
  if (!doc) throw new Error(`Upsert returned no ${label}`);
  return doc;
}

/* Catches broken references and rules the schema cannot express before anything is written. */
function assertSeedIntegrity(): void {
  const problems: string[] = [];
  const usernames = new Set(SEED_USERS.map((user) => user.username));
  const communities = new Map(SEED_COMMUNITIES.map((community) => [community.slug, community]));
  const postKeys = new Set(SEED_POSTS.map((post) => post.key));
  const memberships = new Set<string>();

  for (const name of duplicates(SEED_USERS.map((user) => user.username))) problems.push(`duplicate username "${name}"`);
  for (const slug of duplicates(SEED_COMMUNITIES.map((community) => community.slug))) {
    problems.push(`duplicate community slug "${slug}"`);
  }
  for (const key of duplicates(SEED_POSTS.map((post) => post.key))) problems.push(`duplicate post key "${key}"`);
  for (const slug of duplicates(SEED_POSTS.map((post) => slugify(post.title)))) {
    problems.push(`duplicate post slug "${slug}"`);
  }

  for (const community of SEED_COMMUNITIES) {
    if (!usernames.has(community.createdBy)) problems.push(`community "${community.slug}" has unknown creator`);
  }

  const membershipCount = new Map<string, number>();
  for (const membership of SEED_MEMBERSHIPS) {
    const pair = `${membership.username}:${membership.community}`;
    if (memberships.has(pair)) problems.push(`duplicate membership ${pair}`);
    memberships.add(pair);
    if (!usernames.has(membership.username)) problems.push(`membership has unknown user "${membership.username}"`);
    if (!communities.has(membership.community)) problems.push(`membership has unknown community "${membership.community}"`);
    membershipCount.set(membership.username, (membershipCount.get(membership.username) ?? 0) + 1);
  }
  for (const username of usernames) {
    const count = membershipCount.get(username) ?? 0;
    if (count < MIN_MEMBERSHIPS_PER_USER || count > MAX_MEMBERSHIPS_PER_USER) {
      problems.push(`user "${username}" has ${count} memberships (expected 2-4)`);
    }
  }

  for (const post of SEED_POSTS) {
    const community = communities.get(post.community);
    if (!community) {
      problems.push(`post "${post.key}" has unknown community "${post.community}"`);
      continue;
    }
    if (!usernames.has(post.author)) problems.push(`post "${post.key}" has unknown author "${post.author}"`);
    if (!memberships.has(`${post.author}:${post.community}`)) {
      problems.push(`post "${post.key}" author "${post.author}" is not a member of "${post.community}"`);
    }
    for (const tag of post.tags) {
      if (!community.topics.includes(tag)) problems.push(`post "${post.key}" tag "${tag}" is not a topic of "${post.community}"`);
    }
  }

  for (const comment of SEED_COMMENTS) {
    if (!postKeys.has(comment.post)) problems.push(`comment has unknown post "${comment.post}"`);
    if (!usernames.has(comment.author)) problems.push(`comment has unknown author "${comment.author}"`);
  }

  for (const bookmark of SEED_BOOKMARKS) {
    if (!postKeys.has(bookmark.post)) problems.push(`bookmark has unknown post "${bookmark.post}"`);
    if (!usernames.has(bookmark.username)) problems.push(`bookmark has unknown user "${bookmark.username}"`);
  }

  if (problems.length > 0) {
    throw new Error(`Seed data is inconsistent:\n  - ${problems.join('\n  - ')}`);
  }
}

/* Removes only seed users and what they own. Real users' records are never matched by these filters. */
async function resetSeedContent(): Promise<Record<string, number>> {
  const seedUserIds = (await User.find({ provider: SEED_PROVIDER }, { _id: 1 }).lean()).map((user) => user._id);
  const seedPostIds = (await Post.find({ author: { $in: seedUserIds } }, { _id: 1 }).lean()).map((post) => post._id);

  const comments = await Comment.deleteMany({ $or: [{ author: { $in: seedUserIds } }, { post: { $in: seedPostIds } }] });
  const bookmarks = await Bookmark.deleteMany({ $or: [{ user: { $in: seedUserIds } }, { post: { $in: seedPostIds } }] });
  const memberships = await Membership.deleteMany({ user: { $in: seedUserIds } });
  const posts = await Post.deleteMany({ _id: { $in: seedPostIds } });
  const users = await User.deleteMany({ _id: { $in: seedUserIds } });

  return {
    users: users.deletedCount,
    posts: posts.deletedCount,
    comments: comments.deletedCount,
    bookmarks: bookmarks.deletedCount,
    memberships: memberships.deletedCount,
  };
}

async function upsertUsers(clock: Clock): Promise<Map<string, Types.ObjectId>> {
  const ids = new Map<string, Types.ObjectId>();
  for (const seed of SEED_USERS) {
    const createdAt = daysBefore(clock, seed.createdDaysAgo);
    const doc = await User.findOneAndUpdate(
      { provider: SEED_PROVIDER, providerAccountId: `seed-${seed.username}` },
      {
        $set: {
          name: seed.name,
          username: seed.username,
          bio: seed.bio,
          skills: seed.skills,
          createdAt,
          updatedAt: createdAt,
        },
      },
      UPSERT,
    );
    ids.set(seed.username, requireDocument(doc, `user ${seed.username}`)._id);
  }
  return ids;
}

async function upsertCommunities(clock: Clock, userIds: Map<string, Types.ObjectId>): Promise<Map<string, Types.ObjectId>> {
  const ids = new Map<string, Types.ObjectId>();
  for (const seed of SEED_COMMUNITIES) {
    const createdAt = daysBefore(clock, seed.createdDaysAgo);
    const doc = await Community.findOneAndUpdate(
      { slug: seed.slug },
      {
        $set: {
          name: seed.name,
          slug: seed.slug,
          description: seed.description,
          topics: seed.topics,
          icon: seed.icon,
          color: seed.color,
          createdBy: mustGet(userIds, seed.createdBy, 'user'),
          createdAt,
          updatedAt: createdAt,
        },
      },
      UPSERT,
    );
    ids.set(seed.slug, requireDocument(doc, `community ${seed.slug}`)._id);
  }
  return ids;
}

async function upsertMemberships(
  clock: Clock,
  userIds: Map<string, Types.ObjectId>,
  communityIds: Map<string, Types.ObjectId>,
): Promise<void> {
  for (const seed of SEED_MEMBERSHIPS) {
    await Membership.updateOne(
      {
        user: mustGet(userIds, seed.username, 'user'),
        community: mustGet(communityIds, seed.community, 'community'),
      },
      { $set: { createdAt: daysBefore(clock, seed.joinedDaysAgo) } },
      { upsert: true, timestamps: false },
    );
  }
}

async function upsertPosts(
  clock: Clock,
  userIds: Map<string, Types.ObjectId>,
  communityIds: Map<string, Types.ObjectId>,
): Promise<Map<string, PostRef>> {
  const refs = new Map<string, PostRef>();
  for (const seed of SEED_POSTS) {
    const slug = slugify(seed.title);
    const author = mustGet(userIds, seed.author, 'user');
    const publishedAt = new Date(daysBefore(clock, seed.daysAgo).getTime() + seed.hourUtc * HOUR_MS);
    const doc = await Post.findOneAndUpdate(
      { slug, author },
      {
        $set: {
          title: seed.title,
          slug,
          excerpt: seed.excerpt,
          content: seed.content,
          tags: seed.tags,
          author,
          community: mustGet(communityIds, seed.community, 'community'),
          status: 'published',
          readingTime: readingTime(seed.content),
          publishedAt,
          createdAt: publishedAt,
          updatedAt: publishedAt,
        },
      },
      UPSERT,
    );
    refs.set(seed.key, { id: requireDocument(doc, `post ${seed.key}`)._id, publishedAt });
  }
  return refs;
}

async function upsertComments(
  clock: Clock,
  userIds: Map<string, Types.ObjectId>,
  postRefs: Map<string, PostRef>,
): Promise<void> {
  for (const seed of SEED_COMMENTS) {
    const post = mustGet(postRefs, seed.post, 'post');
    const createdAt = notInFuture(new Date(post.publishedAt.getTime() + seed.hoursAfterPublish * HOUR_MS), clock.now);
    await Comment.updateOne(
      { post: post.id, author: mustGet(userIds, seed.author, 'user'), content: seed.content },
      { $set: { createdAt, updatedAt: createdAt } },
      { upsert: true, timestamps: false },
    );
  }
}

async function upsertBookmarks(clock: Clock, userIds: Map<string, Types.ObjectId>, postRefs: Map<string, PostRef>): Promise<void> {
  for (const seed of SEED_BOOKMARKS) {
    const post = mustGet(postRefs, seed.post, 'post');
    const createdAt = notInFuture(new Date(post.publishedAt.getTime() + 6 * HOUR_MS), clock.now);
    await Bookmark.updateOne(
      { user: mustGet(userIds, seed.username, 'user'), post: post.id },
      { $set: { createdAt } },
      { upsert: true, timestamps: false },
    );
  }
}

/* Recomputed from the Membership collection rather than incremented, so the counter cannot drift on reruns. */
async function syncMemberCounts(communityIds: Map<string, Types.ObjectId>): Promise<void> {
  for (const communityId of communityIds.values()) {
    const memberCount = await Membership.countDocuments({ community: communityId });
    await Community.updateOne({ _id: communityId }, { $set: { memberCount } }, { timestamps: false });
  }
}

async function databaseTotals(): Promise<string> {
  const [users, communities, memberships, posts, comments, bookmarks] = await Promise.all([
    User.countDocuments(),
    Community.countDocuments(),
    Membership.countDocuments(),
    Post.countDocuments(),
    Comment.countDocuments(),
    Bookmark.countDocuments(),
  ]);
  return `users ${users}, communities ${communities}, memberships ${memberships}, posts ${posts}, comments ${comments}, bookmarks ${bookmarks}`;
}

async function main(): Promise<void> {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it to .env.local (see .env.example), then run: npm run seed');
  }
  const reset = process.argv.includes('--reset');

  assertSeedIntegrity();
  await connectDB();

  if (reset) {
    const removed = await resetSeedContent();
    console.log(`Reset removed seed content: ${Object.entries(removed).map(([name, count]) => `${name} ${count}`).join(', ')}`);
  }

  const clock = currentClock();
  const userIds = await upsertUsers(clock);
  const communityIds = await upsertCommunities(clock, userIds);
  await upsertMemberships(clock, userIds, communityIds);
  const postRefs = await upsertPosts(clock, userIds, communityIds);
  await upsertComments(clock, userIds, postRefs);
  await upsertBookmarks(clock, userIds, postRefs);
  await syncMemberCounts(communityIds);

  console.log(
    `Seeded: ${SEED_USERS.length} users, ${SEED_COMMUNITIES.length} communities, ${SEED_MEMBERSHIPS.length} memberships, ` +
      `${SEED_POSTS.length} posts, ${SEED_COMMENTS.length} comments, ${SEED_BOOKMARKS.length} bookmarks`,
  );
  console.log(`Database totals: ${await databaseTotals()}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? `Seed failed: ${error.message}` : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
