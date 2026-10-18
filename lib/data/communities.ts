import type { QueryFilter, Types } from 'mongoose';
import { escapeRegex } from '@/lib/escape-regex';
import { assertObjectId, connectDB, isDuplicateKeyError } from '@/lib/db';
import { notFound } from '@/lib/errors';
import { pageWindow, toCommunityDTO, toPaginated, type LeanCommunity } from '@/lib/serialize';
import { Community, type CommunityAttributes } from '@/models/community';
import { Membership } from '@/models/membership';
import { Post, type PostAttributes } from '@/models/post';
import type { CommunitiesQuery } from '@/schemas/query';
import type { CommunityDTO, MembershipDTO, PaginatedResult, SessionUser, TopicCountDTO } from '@/types';

type CommunityFilter = QueryFilter<CommunityAttributes>;
type PostFilter = QueryFilter<PostAttributes>;

const DEFAULT_PAGE_SIZE = 12;
const MAX_LIST_LIMIT = 50;

function clampCount(value: number, max: number): number {
  return Math.min(max, Math.max(1, Math.floor(value)));
}

export async function listCommunities(query: Partial<CommunitiesQuery> = {}): Promise<PaginatedResult<CommunityDTO>> {
  await connectDB();

  const filter: CommunityFilter = {};
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: pattern }, { description: pattern }];
  }
  if (query.topic) {
    filter.topics = query.topic.toLowerCase();
  }

  const window = pageWindow({ page: query.page, limit: query.limit }, DEFAULT_PAGE_SIZE);
  const [rows, total] = await Promise.all([
    Community.find(filter)
      .sort({ memberCount: -1, name: 1, _id: 1 })
      .skip(window.skip)
      .limit(window.limit)
      .lean<LeanCommunity[]>(),
    Community.countDocuments(filter),
  ]);

  return toPaginated(rows.map(toCommunityDTO), total, window);
}

export async function getCommunityBySlug(slug: string): Promise<CommunityDTO | null> {
  await connectDB();
  const row = await Community.findOne({ slug: slug.toLowerCase() }).lean<LeanCommunity>();
  return row ? toCommunityDTO(row) : null;
}

export async function getCommunityById(id: string): Promise<CommunityDTO | null> {
  assertObjectId(id, 'community id');
  await connectDB();
  const row = await Community.findById(id).lean<LeanCommunity>();
  return row ? toCommunityDTO(row) : null;
}

export async function isMember(userId: string, communityId: string): Promise<boolean> {
  assertObjectId(userId, 'user id');
  assertObjectId(communityId, 'community id');
  await connectDB();
  return Boolean(await Membership.exists({ user: userId, community: communityId }));
}

async function readMembershipState(userId: string, communityId: string): Promise<MembershipDTO> {
  const community = await Community.findById(communityId).select('memberCount').lean<{ memberCount: number }>();
  if (!community) {
    throw notFound('Community not found');
  }
  const member = await isMember(userId, communityId);
  return { member, memberCount: community.memberCount };
}

/** Membership state for the current user; throws 404 for an unknown community. */
export async function getMembershipStatus(userId: string, communityId: string): Promise<MembershipDTO> {
  assertObjectId(userId, 'user id');
  assertObjectId(communityId, 'community id');
  await connectDB();
  return readMembershipState(userId, communityId);
}

/**
 * Idempotent: joining twice is a no-op. The membership row is created first and
 * `memberCount` is incremented only if that insert succeeded, so the counter cannot drift
 * when two requests race.
 */
export async function joinCommunity(user: SessionUser, communityId: string): Promise<MembershipDTO> {
  assertObjectId(user.id, 'user id');
  assertObjectId(communityId, 'community id');
  await connectDB();

  const exists = await Community.exists({ _id: communityId });
  if (!exists) {
    throw notFound('Community not found');
  }

  try {
    await Membership.create({ user: user.id, community: communityId });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    return readMembershipState(user.id, communityId);
  }

  const updated = await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: 1 } }, { new: true })
    .select('memberCount')
    .lean<{ memberCount: number }>();
  return { member: true, memberCount: updated?.memberCount ?? 0 };
}

/** Idempotent: leaving when not a member is a no-op. The count only drops when a row was removed. */
export async function leaveCommunity(user: SessionUser, communityId: string): Promise<MembershipDTO> {
  assertObjectId(user.id, 'user id');
  assertObjectId(communityId, 'community id');
  await connectDB();

  const exists = await Community.exists({ _id: communityId });
  if (!exists) {
    throw notFound('Community not found');
  }

  const result = await Membership.deleteOne({ user: user.id, community: communityId });
  if (result.deletedCount === 1) {
    await Community.updateOne({ _id: communityId, memberCount: { $gt: 0 } }, { $inc: { memberCount: -1 } });
  }
  return readMembershipState(user.id, communityId);
}

export async function listUserCommunities(userId: string): Promise<CommunityDTO[]> {
  assertObjectId(userId, 'user id');
  await connectDB();

  const memberships = await Membership.find({ user: userId })
    .select('community')
    .lean<{ community: Types.ObjectId }[]>();
  if (memberships.length === 0) return [];

  const rows = await Community.find({ _id: { $in: memberships.map((m) => m.community) } })
    .sort({ name: 1 })
    .lean<LeanCommunity[]>();
  return rows.map(toCommunityDTO);
}

export async function getFeaturedCommunities(limit: number): Promise<CommunityDTO[]> {
  await connectDB();
  const rows = await Community.find()
    .sort({ memberCount: -1, name: 1 })
    .limit(clampCount(limit, MAX_LIST_LIMIT))
    .lean<LeanCommunity[]>();
  return rows.map(toCommunityDTO);
}

/** Distinct topics used by any community or any published post, alphabetically sorted. */
export async function listAllTopics(): Promise<string[]> {
  await connectDB();
  const publishedFilter: PostFilter = { status: 'published' };
  const [communityTopics, postTags] = await Promise.all([
    Community.distinct('topics'),
    Post.distinct('tags', publishedFilter),
  ]);
  const merged = new Set<string>([...communityTopics.map(String), ...postTags.map(String)]);
  return [...merged].sort((a, b) => a.localeCompare(b));
}

/** Most frequently used tags across published posts. */
export async function getTrendingTopics(limit: number): Promise<TopicCountDTO[]> {
  await connectDB();
  const rows = await Post.aggregate<{ _id: string; count: number }>([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: clampCount(limit, MAX_LIST_LIMIT) },
  ]);
  return rows.map((row) => ({ topic: row._id, count: row.count }));
}
