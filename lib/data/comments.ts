import type { Types } from 'mongoose';
import { canModify } from '@/lib/auth-helpers';
import { assertObjectId, connectDB } from '@/lib/db';
import { forbidden, notFound } from '@/lib/errors';
import { PUBLIC_AUTHOR_FIELDS, pageWindow, toCommentDTO, toPaginated, type LeanComment } from '@/lib/serialize';
import { Comment } from '@/models/comment';
import { Post, type PostAttributes } from '@/models/post';
import { isPostVisible } from '@/lib/data/posts';
import type { CreateCommentInput } from '@/schemas/comment';
import type { PaginationQuery } from '@/schemas/query';
import type { CommentDTO, PaginatedResult, SessionUser } from '@/types';

type Viewer = SessionUser | null | undefined;

const DEFAULT_PAGE_SIZE = 20;

/** Comments follow their post's visibility: a draft's comments are visible only to its author and admins. */
async function assertPostVisible(postId: string, viewer: Viewer): Promise<void> {
  const post = await Post.findById(postId)
    .select('status author')
    .lean<Pick<PostAttributes, 'status'> & { author: Types.ObjectId }>();
  if (!post || !isPostVisible(post.status, post.author.toString(), viewer)) {
    throw notFound('Post not found');
  }
}

export async function listComments(
  postId: string,
  query: Partial<PaginationQuery> = {},
  viewer?: Viewer,
): Promise<PaginatedResult<CommentDTO>> {
  assertObjectId(postId, 'post id');
  await connectDB();
  await assertPostVisible(postId, viewer);

  const window = pageWindow({ page: query.page, limit: query.limit }, DEFAULT_PAGE_SIZE);
  const [rows, total] = await Promise.all([
    Comment.find({ post: postId })
      .sort({ createdAt: 1, _id: 1 })
      .skip(window.skip)
      .limit(window.limit)
      .populate({ path: 'author', select: PUBLIC_AUTHOR_FIELDS })
      .lean<LeanComment[]>(),
    Comment.countDocuments({ post: postId }),
  ]);

  return toPaginated(rows.map(toCommentDTO), total, window);
}

export async function createComment(user: SessionUser, postId: string, input: CreateCommentInput): Promise<CommentDTO> {
  assertObjectId(user.id, 'user id');
  assertObjectId(postId, 'post id');
  await connectDB();
  await assertPostVisible(postId, user);

  const created = await Comment.create({ post: postId, author: user.id, content: input.content });
  const row = await Comment.findById(created._id)
    .populate({ path: 'author', select: PUBLIC_AUTHOR_FIELDS })
    .lean<LeanComment>();
  if (!row) {
    throw notFound('Comment not found after creation');
  }
  return toCommentDTO(row);
}

/** Allowed for the comment's author, the author of the post, and admins. */
export async function deleteComment(user: SessionUser, commentId: string): Promise<void> {
  assertObjectId(commentId, 'comment id');
  await connectDB();

  const comment = await Comment.findById(commentId).select('author post').lean<{ author: Types.ObjectId; post: Types.ObjectId }>();
  if (!comment) {
    throw notFound('Comment not found');
  }

  if (!canModify(user, comment.author)) {
    const post = await Post.findById(comment.post).select('author').lean<{ author: Types.ObjectId }>();
    if (!post || !canModify(user, post.author)) {
      throw forbidden();
    }
  }

  await Comment.deleteOne({ _id: commentId });
}
