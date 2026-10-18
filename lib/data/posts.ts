import type { QueryFilter, Types } from 'mongoose';
import { assertCanModify, canModify } from '@/lib/auth-helpers';
import { isMember } from '@/lib/data/communities';
import { assertObjectId, connectDB, isDuplicateKeyError } from '@/lib/db';
import { conflict, forbidden, notFound } from '@/lib/errors';
import { escapeRegex } from '@/lib/escape-regex';
import {
  PUBLIC_AUTHOR_FIELDS,
  PUBLIC_COMMUNITY_FIELDS,
  pageWindow,
  toPaginated,
  toPostDetail,
  toPostSummary,
  type LeanPost,
} from '@/lib/serialize';
import { readingTime, uniqueSlug } from '@/lib/slug';
import { Bookmark } from '@/models/bookmark';
import { Comment } from '@/models/comment';
import { Community } from '@/models/community';
import { Post, type PostAttributes } from '@/models/post';
import { User } from '@/models/user';
import type { CreatePostInput, UpdatePostInput } from '@/schemas/post';
import type { PostsQuery } from '@/schemas/query';
import type { PaginatedResult, PostDetailDTO, PostStatus, PostSummaryDTO, SessionUser } from '@/types';

type PostFilter = QueryFilter<PostAttributes>;
type Viewer = SessionUser | null | undefined;

const DEFAULT_PAGE_SIZE = 10;
const MAX_SLUG_ATTEMPTS = 2;
const POST_POPULATE = [
  { path: 'author', select: PUBLIC_AUTHOR_FIELDS },
  { path: 'community', select: PUBLIC_COMMUNITY_FIELDS },
];

/** Drafts are visible only to their author and to admins. */
export function isPostVisible(status: PostStatus, authorId: string, viewer?: Viewer): boolean {
  if (status === 'published') return true;
  return viewer ? canModify(viewer, authorId) : false;
}

function authorIdOf(post: LeanPost): string {
  return post.author?._id.toString() ?? '';
}

async function findPostDetail(filter: { _id: string } | { slug: string }, viewer: Viewer): Promise<PostDetailDTO | null> {
  const row = await Post.findOne(filter).populate(POST_POPULATE).lean<LeanPost>();
  if (!row || !isPostVisible(row.status, authorIdOf(row), viewer)) return null;
  return toPostDetail(row);
}

export async function listPosts(query: Partial<PostsQuery> = {}, viewer?: Viewer): Promise<PaginatedResult<PostSummaryDTO>> {
  await connectDB();

  const window = pageWindow({ page: query.page, limit: query.limit }, DEFAULT_PAGE_SIZE);
  const filter: PostFilter = {};

  // Authors can list their own drafts; everyone else only sees published posts.
  const viewingOwnPosts = Boolean(query.author && viewer && viewer.username === query.author);
  if (!viewingOwnPosts) {
    filter.status = 'published';
  }

  if (query.author) {
    const author = await User.findOne({ username: query.author }).select('_id').lean<{ _id: Types.ObjectId }>();
    if (!author) return toPaginated([], 0, window);
    filter.author = author._id;
  }

  if (query.community) {
    const community = await Community.findOne({ slug: query.community }).select('_id').lean<{ _id: Types.ObjectId }>();
    if (!community) return toPaginated([], 0, window);
    filter.community = community._id;
  }

  if (query.topic) {
    filter.tags = query.topic.toLowerCase();
  }

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ title: pattern }, { excerpt: pattern }, { tags: pattern }];
  }

  const direction: 1 | -1 = query.sort === 'oldest' ? 1 : -1;
  const [rows, total] = await Promise.all([
    Post.find(filter)
      .select('-content')
      .populate(POST_POPULATE)
      .sort({ publishedAt: direction, _id: direction })
      .skip(window.skip)
      .limit(window.limit)
      .lean<LeanPost[]>(),
    Post.countDocuments(filter),
  ]);

  return toPaginated(rows.map(toPostSummary), total, window);
}

export async function getLatestPosts(limit: number): Promise<PostSummaryDTO[]> {
  await connectDB();
  const rows = await Post.find({ status: 'published' })
    .select('-content')
    .populate(POST_POPULATE)
    .sort({ publishedAt: -1, _id: -1 })
    .limit(Math.min(50, Math.max(1, Math.floor(limit))))
    .lean<LeanPost[]>();
  return rows.map(toPostSummary);
}

export async function getPostBySlug(slug: string, viewer?: Viewer): Promise<PostDetailDTO | null> {
  await connectDB();
  return findPostDetail({ slug: slug.toLowerCase() }, viewer);
}

export async function getPostById(id: string, viewer?: Viewer): Promise<PostDetailDTO | null> {
  assertObjectId(id, 'post id');
  await connectDB();
  return findPostDetail({ _id: id }, viewer);
}

/** Published posts by one author (drafts too, when the viewer is that author). */
export async function listPostsByAuthor(
  username: string,
  options: { page?: number; limit?: number; viewer?: Viewer } = {},
): Promise<PaginatedResult<PostSummaryDTO>> {
  return listPosts({ author: username, page: options.page, limit: options.limit, sort: 'newest' }, options.viewer);
}

/** Creates a post; the author must already be a member of the target community. */
export async function createPost(user: SessionUser, input: CreatePostInput): Promise<PostDetailDTO> {
  assertObjectId(user.id, 'user id');
  const communityId = assertObjectId(input.communityId, 'community id');
  await connectDB();

  const communityExists = await Community.exists({ _id: communityId });
  if (!communityExists) {
    throw notFound('Community not found');
  }
  if (!(await isMember(user.id, communityId))) {
    throw forbidden('Join this community before publishing in it');
  }

  const status = input.status ?? 'published';
  let created: { _id: Types.ObjectId } | null = null;
  for (let attempt = 1; created === null; attempt += 1) {
    // uniqueSlug checks before writing, so a concurrent insert can still take the slug; regenerate once.
    const slug = await uniqueSlug(Post, input.title);
    try {
      created = await Post.create({
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        coverImage: input.coverImage || undefined,
        author: user.id,
        community: communityId,
        tags: input.tags,
        status,
        readingTime: readingTime(input.content),
        publishedAt: status === 'published' ? new Date() : undefined,
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      if (attempt >= MAX_SLUG_ATTEMPTS) {
        throw conflict('Could not generate a unique slug, please try again');
      }
    }
  }

  const detail = await findPostDetail({ _id: created._id.toString() }, user);
  if (!detail) {
    throw notFound('Post not found after creation');
  }
  return detail;
}

/** The slug is stable after creation (links stay valid); only content-derived fields are recomputed. */
export async function updatePost(user: SessionUser, id: string, input: UpdatePostInput): Promise<PostDetailDTO> {
  assertObjectId(id, 'post id');
  await connectDB();

  const existing = await Post.findById(id)
    .select('author community status')
    .lean<{ author: Types.ObjectId; community: Types.ObjectId; status: PostStatus }>();
  if (!existing) {
    throw notFound('Post not found');
  }
  assertCanModify(user, existing.author);

  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};

  if (input.communityId !== undefined && input.communityId !== existing.community.toString()) {
    const communityId = assertObjectId(input.communityId, 'community id');
    if (!(await Community.exists({ _id: communityId }))) {
      throw notFound('Community not found');
    }
    // Same rule as createPost: the post's author, not the editor, must belong to the target community.
    if (!(await isMember(existing.author.toString(), communityId))) {
      throw forbidden('Join this community before moving the post into it');
    }
    set.community = communityId;
  }

  if (input.title !== undefined) set.title = input.title;
  if (input.excerpt !== undefined) set.excerpt = input.excerpt;
  if (input.content !== undefined) {
    set.content = input.content;
    set.readingTime = readingTime(input.content);
  }
  if (input.tags !== undefined) set.tags = input.tags;
  if (input.status !== undefined) {
    set.status = input.status;
    // publishedAt records the publication, so it is set on each draft-to-published transition and cleared when unpublished.
    if (input.status === 'published' && existing.status === 'draft') set.publishedAt = new Date();
    if (input.status === 'draft' && existing.status === 'published') unset.publishedAt = 1;
  }
  if (input.coverImage === '') {
    unset.coverImage = 1;
  } else if (input.coverImage !== undefined) {
    set.coverImage = input.coverImage;
  }

  const update: Record<string, unknown> = {};
  if (Object.keys(set).length > 0) update.$set = set;
  if (Object.keys(unset).length > 0) update.$unset = unset;

  if (Object.keys(update).length > 0) {
    try {
      await Post.updateOne({ _id: id }, update, { runValidators: true });
    } catch (error) {
      if (isDuplicateKeyError(error)) throw conflict('Could not update the post');
      throw error;
    }
  }

  const detail = await findPostDetail({ _id: id }, user);
  if (!detail) {
    throw notFound('Post not found');
  }
  return detail;
}

/** Removes the post together with its comments and bookmarks. */
export async function deletePost(user: SessionUser, id: string): Promise<void> {
  assertObjectId(id, 'post id');
  await connectDB();

  const existing = await Post.findById(id).select('author').lean<{ author: Types.ObjectId }>();
  if (!existing) {
    throw notFound('Post not found');
  }
  assertCanModify(user, existing.author);

  await Post.deleteOne({ _id: id });
  await Promise.all([Comment.deleteMany({ post: id }), Bookmark.deleteMany({ post: id })]);
}
