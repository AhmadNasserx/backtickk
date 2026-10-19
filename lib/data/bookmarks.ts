import type { Types } from 'mongoose';
import { assertObjectId, connectDB, isDuplicateKeyError } from '@/lib/db';
import { notFound } from '@/lib/errors';
import { PUBLIC_AUTHOR_FIELDS, PUBLIC_COMMUNITY_FIELDS, pageWindow, toPaginated, toPostSummary, type LeanPost } from '@/lib/serialize';
import { Bookmark } from '@/models/bookmark';
import { Post } from '@/models/post';
import { isPostVisible } from '@/lib/data/posts';
import type { PaginationQuery } from '@/schemas/query';
import type { BookmarkStatusDTO, PaginatedResult, PostSummaryDTO, SessionUser } from '@/types';

const DEFAULT_PAGE_SIZE = 10;

export async function isBookmarked(userId: string, postId: string): Promise<boolean> {
  assertObjectId(userId, 'user id');
  assertObjectId(postId, 'post id');
  await connectDB();
  return Boolean(await Bookmark.exists({ user: userId, post: postId }));
}

/** Idempotent: bookmarking twice is a no-op. */
export async function addBookmark(user: SessionUser, postId: string): Promise<BookmarkStatusDTO> {
  assertObjectId(user.id, 'user id');
  assertObjectId(postId, 'post id');
  await connectDB();

  const post = await Post.findById(postId).select('status author').lean<{ status: LeanPost['status']; author: Types.ObjectId }>();
  if (!post || !isPostVisible(post.status, post.author.toString(), user)) {
    throw notFound('Post not found');
  }

  try {
    await Bookmark.create({ user: user.id, post: postId });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
  return { bookmarked: true };
}

/** Idempotent: removing a missing bookmark is a no-op. */
export async function removeBookmark(user: SessionUser, postId: string): Promise<BookmarkStatusDTO> {
  assertObjectId(user.id, 'user id');
  assertObjectId(postId, 'post id');
  await connectDB();

  await Bookmark.deleteOne({ user: user.id, post: postId });
  return { bookmarked: false };
}

/**
 * Newest bookmarks first. Posts unpublished since being bookmarked are left out, so a page can
 * hold fewer items than `limit`; `total` counts bookmark rows.
 */
export async function listBookmarks(userId: string, query: Partial<PaginationQuery> = {}): Promise<PaginatedResult<PostSummaryDTO>> {
  assertObjectId(userId, 'user id');
  await connectDB();

  const window = pageWindow({ page: query.page, limit: query.limit }, DEFAULT_PAGE_SIZE);
  const [bookmarks, total] = await Promise.all([
    Bookmark.find({ user: userId })
      .select('post')
      .sort({ createdAt: -1, _id: -1 })
      .skip(window.skip)
      .limit(window.limit)
      .lean<{ post: Types.ObjectId }[]>(),
    Bookmark.countDocuments({ user: userId }),
  ]);

  const postIds = bookmarks.map((bookmark) => bookmark.post);
  const posts = postIds.length
    ? await Post.find({ _id: { $in: postIds }, status: 'published' })
        .select('-content')
        .populate([
          { path: 'author', select: PUBLIC_AUTHOR_FIELDS },
          { path: 'community', select: PUBLIC_COMMUNITY_FIELDS },
        ])
        .lean<LeanPost[]>()
    : [];

  // Keep the bookmark order (the query above does not preserve it).
  const byId = new Map(posts.map((post) => [post._id.toString(), post]));
  const items = postIds.flatMap((postId) => {
    const post = byId.get(postId.toString());
    return post ? [toPostSummary(post)] : [];
  });

  return toPaginated(items, total, window);
}
