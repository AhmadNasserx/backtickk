import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCommentSchema } from '@/schemas/comment';
import { createPostSchema, updatePostSchema } from '@/schemas/post';
import { createComment, deleteComment, listComments } from '@/lib/data/comments';
import { addBookmark, listBookmarks } from '@/lib/data/bookmarks';
import { createPost, deletePost, getPostById, getPostBySlug, updatePost } from '@/lib/data/posts';
import { Bookmark } from '@/models/bookmark';
import { Comment } from '@/models/comment';
import { Post } from '@/models/post';
import { expectStatus } from './setup/assertions';
import {
  clearDb,
  makeBookmark,
  makeComment,
  makeCommunity,
  makeMembership,
  makePost,
  makeUser,
  newObjectId,
  startDb,
  stopDb,
} from './setup/db';

beforeAll(async () => {
  await startDb();
});

afterAll(async () => {
  await stopDb();
});

beforeEach(async () => {
  await clearDb();
});

afterEach(() => {
  vi.useRealTimers();
});

const BODY = 'A body that is comfortably longer than the twenty character minimum.';

function newPostInput(communityId: string, overrides: Record<string, unknown> = {}) {
  return createPostSchema.parse({
    title: 'Authorization fixture post',
    excerpt: 'Excerpt',
    content: BODY,
    communityId,
    ...overrides,
  });
}

describe('creating a post', () => {
  it('is refused with 403 when the author has not joined the community', async () => {
    const author = await makeUser();
    const community = await makeCommunity();

    await expectStatus(createPost(author, newPostInput(community.id)), 403);
    expect(await Post.countDocuments()).toBe(0);
  });

  it('succeeds once the author is a member of the community', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    await makeMembership(author.id, community.id);

    const created = await createPost(author, newPostInput(community.id));

    expect(created.author.id).toBe(author.id);
    expect(created.community.slug).toBe(community.slug);
  });

  it('is refused with 404 when the community does not exist', async () => {
    const author = await makeUser();

    await expectStatus(createPost(author, newPostInput(newObjectId())), 404);
  });

  it('does not let membership in one community unlock another', async () => {
    const author = await makeUser();
    const joined = await makeCommunity();
    const notJoined = await makeCommunity();
    await makeMembership(author.id, joined.id);

    await expectStatus(createPost(author, newPostInput(notJoined.id)), 403);
  });
});

describe('editing a post', () => {
  it('lets the author update their own post, keeping its slug stable', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    await makeMembership(author.id, community.id);
    const post = await makePost(author, community, { title: 'Original title', slug: 'stable-slug' });

    const updated = await updatePost(author, post.id, updatePostSchema.parse({ title: 'Renamed title' }));

    expect(updated.title).toBe('Renamed title');
    expect(updated.slug).toBe('stable-slug');
  });

  it('refuses an edit by another user with 403 and leaves the post unchanged', async () => {
    const author = await makeUser();
    const stranger = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community, { title: 'Original title' });

    await expectStatus(updatePost(stranger, post.id, updatePostSchema.parse({ title: 'Hijacked' })), 403);

    expect((await Post.findById(post.id).lean())?.title).toBe('Original title');
  });

  it('lets an admin edit a post they did not write', async () => {
    const author = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const community = await makeCommunity();
    const post = await makePost(author, community, { title: 'Original title' });

    const updated = await updatePost(admin, post.id, updatePostSchema.parse({ excerpt: 'Moderated excerpt' }));

    expect(updated.excerpt).toBe('Moderated excerpt');
  });

  it('returns 404 for a well-formed id that matches no post', async () => {
    const user = await makeUser();

    await expectStatus(updatePost(user, newObjectId(), updatePostSchema.parse({ title: 'Nobody home' })), 404);
  });

  it('returns 400 for an id that is not an ObjectId', async () => {
    const user = await makeUser();

    await expectStatus(updatePost(user, 'not-an-id', updatePostSchema.parse({ title: 'Bad id' })), 400);
  });

  it('refuses to move a post into a community the editor has not joined', async () => {
    const author = await makeUser();
    const home = await makeCommunity();
    const target = await makeCommunity();
    await makeMembership(author.id, home.id);
    const post = await makePost(author, home);

    await expectStatus(updatePost(author, post.id, updatePostSchema.parse({ communityId: target.id })), 403);

    expect((await Post.findById(post.id).lean())?.community.toString()).toBe(home.id);
  });

  it('allows a move into a community the author has joined', async () => {
    const author = await makeUser();
    const home = await makeCommunity();
    const target = await makeCommunity();
    await makeMembership(author.id, home.id);
    await makeMembership(author.id, target.id);
    const post = await makePost(author, home);

    const moved = await updatePost(author, post.id, updatePostSchema.parse({ communityId: target.id }));

    expect(moved.community.id).toBe(target.id);
  });

  /*
   * Business rule: createPost requires the *author* to be a member. updatePost checks the
   * membership of the post's author, so an admin who belongs to the target community cannot move
   * another author's post into a community that author never joined.
   */
  it('requires the post author (not the editing admin) to be a member of the target community', async () => {
    const author = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const home = await makeCommunity();
    const target = await makeCommunity();
    await makeMembership(author.id, home.id);
    await makeMembership(admin.id, target.id);
    const post = await makePost(author, home);

    await expectStatus(updatePost(admin, post.id, updatePostSchema.parse({ communityId: target.id })), 403);
  });
});

describe('deleting a post', () => {
  it('lets the author delete their own post', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community);

    await deletePost(author, post.id);

    expect(await Post.exists({ _id: post.id })).toBeNull();
  });

  it('refuses deletion by another user with 403 and keeps the post', async () => {
    const author = await makeUser();
    const stranger = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community);

    await expectStatus(deletePost(stranger, post.id), 403);

    expect(await Post.exists({ _id: post.id })).not.toBeNull();
  });

  it('lets an admin delete a post they did not write', async () => {
    const author = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const community = await makeCommunity();
    const post = await makePost(author, community);

    await deletePost(admin, post.id);

    expect(await Post.exists({ _id: post.id })).toBeNull();
  });

  it('returns 404 for an unknown post and 400 for a malformed id', async () => {
    const user = await makeUser();

    await expectStatus(deletePost(user, newObjectId()), 404);
    await expectStatus(deletePost(user, 'bogus'), 400);
  });

  it('removes the post together with its comments and bookmarks, and nothing belonging to other posts', async () => {
    const author = await makeUser();
    const reader = await makeUser();
    const community = await makeCommunity();
    const doomed = await makePost(author, community);
    const keeper = await makePost(author, community);

    await makeComment(doomed, author, 'comment on the doomed post');
    await makeComment(doomed, reader, 'another comment on the doomed post');
    await makeComment(keeper, reader, 'comment that must survive');
    await makeBookmark(reader.id, doomed.id);
    await makeBookmark(author.id, doomed.id);
    await makeBookmark(reader.id, keeper.id);

    await deletePost(author, doomed.id);

    expect(await Comment.countDocuments({ post: doomed.id })).toBe(0);
    expect(await Bookmark.countDocuments({ post: doomed.id })).toBe(0);
    expect(await Comment.countDocuments({ post: keeper.id })).toBe(1);
    expect(await Bookmark.countDocuments({ post: keeper.id })).toBe(1);
  });
});

describe('deleting a comment', () => {
  it('lets the comment author delete their own comment on someone else\'s post', async () => {
    const postAuthor = await makeUser();
    const commenter = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(postAuthor, community);
    const commentId = await makeComment(post, commenter);

    await deleteComment(commenter, commentId);

    expect(await Comment.exists({ _id: commentId })).toBeNull();
  });

  it('lets the author of the post delete any comment on it', async () => {
    const postAuthor = await makeUser();
    const commenter = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(postAuthor, community);
    const commentId = await makeComment(post, commenter);

    await deleteComment(postAuthor, commentId);

    expect(await Comment.exists({ _id: commentId })).toBeNull();
  });

  it('lets an admin delete any comment', async () => {
    const postAuthor = await makeUser();
    const commenter = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const community = await makeCommunity();
    const post = await makePost(postAuthor, community);
    const commentId = await makeComment(post, commenter);

    await deleteComment(admin, commentId);

    expect(await Comment.exists({ _id: commentId })).toBeNull();
  });

  it('refuses an unrelated user with 403 and keeps the comment', async () => {
    const postAuthor = await makeUser();
    const commenter = await makeUser();
    const unrelated = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(postAuthor, community);
    const commentId = await makeComment(post, commenter);

    await expectStatus(deleteComment(unrelated, commentId), 403);

    expect(await Comment.exists({ _id: commentId })).not.toBeNull();
  });

  it('returns 404 for an unknown comment and 400 for a malformed id', async () => {
    const user = await makeUser();

    await expectStatus(deleteComment(user, newObjectId()), 404);
    await expectStatus(deleteComment(user, 'bogus'), 400);
  });
});

describe('draft visibility', () => {
  it('hides a draft from anonymous visitors and from other users', async () => {
    const author = await makeUser();
    const stranger = await makeUser();
    const community = await makeCommunity();
    const draft = await makePost(author, community, { status: 'draft', slug: 'secret-draft' });

    expect(await getPostBySlug('secret-draft')).toBeNull();
    expect(await getPostBySlug('secret-draft', null)).toBeNull();
    expect(await getPostBySlug('secret-draft', stranger)).toBeNull();
    expect(await getPostById(draft.id, stranger)).toBeNull();
  });

  it('shows a draft to its author and to admins', async () => {
    const author = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const community = await makeCommunity();
    const draft = await makePost(author, community, { status: 'draft', slug: 'my-draft' });

    expect((await getPostBySlug('my-draft', author))?.status).toBe('draft');
    expect((await getPostBySlug('my-draft', admin))?.id).toBe(draft.id);
    expect((await getPostById(draft.id, author))?.id).toBe(draft.id);
  });

  it('shows a published post to everyone', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    await makePost(author, community, { status: 'published', slug: 'public-post' });

    expect((await getPostBySlug('public-post'))?.slug).toBe('public-post');
  });

  it('hides comments on a draft from users who cannot see the draft', async () => {
    const author = await makeUser();
    const stranger = await makeUser();
    const community = await makeCommunity();
    const draft = await makePost(author, community, { status: 'draft' });
    await makeComment(draft, author, 'a comment on my own draft');

    await expectStatus(listComments(draft.id, {}, stranger), 404);
    await expectStatus(createComment(stranger, draft.id, createCommentSchema.parse({ content: 'Hi there' })), 404);
    expect(await Comment.countDocuments({ post: draft.id })).toBe(1);
  });

  it('does not let a stranger bookmark a draft', async () => {
    const author = await makeUser();
    const stranger = await makeUser();
    const community = await makeCommunity();
    const draft = await makePost(author, community, { status: 'draft' });

    await expectStatus(addBookmark(stranger, draft.id), 404);
    expect(await Bookmark.countDocuments({ post: draft.id })).toBe(0);
  });

  it('keeps a bookmarked post out of a bookmark list once it is unpublished, while counting its row', async () => {
    const author = await makeUser();
    const reader = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community);
    await addBookmark(reader, post.id);

    await updatePost(author, post.id, updatePostSchema.parse({ status: 'draft' }));
    const page = await listBookmarks(reader.id);

    expect(page.items).toEqual([]);
    expect(page.total).toBe(1);
  });
});

describe('publication date', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  async function publishedAtOf(id: string): Promise<Date | undefined> {
    return (await Post.findById(id).lean())?.publishedAt ?? undefined;
  }

  it('is unset for a post created as a draft, in storage and in the response', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    await makeMembership(author.id, community.id);

    const created = await createPost(author, newPostInput(community.id, { status: 'draft' }));

    expect(await publishedAtOf(created.id)).toBeUndefined();
    expect(created.publishedAt).toBeNull();
  });

  it('is set when a post is created as published', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    await makeMembership(author.id, community.id);
    vi.setSystemTime(new Date('2026-03-01T10:00:00Z'));

    const created = await createPost(author, newPostInput(community.id));

    expect(await publishedAtOf(created.id)).toEqual(new Date('2026-03-01T10:00:00Z'));
    expect(created.publishedAt).toBe('2026-03-01T10:00:00.000Z');
  });

  it('is set when a draft is published, and not before', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    const draft = await makePost(author, community, { status: 'draft' });
    vi.setSystemTime(new Date('2026-04-01T09:00:00Z'));

    await updatePost(author, draft.id, updatePostSchema.parse({ status: 'published' }));

    expect(await publishedAtOf(draft.id)).toEqual(new Date('2026-04-01T09:00:00Z'));
  });

  it('is unset again when a published post is unpublished', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community, { publishedAt: new Date('2026-02-01T00:00:00Z') });

    const unpublished = await updatePost(author, post.id, updatePostSchema.parse({ status: 'draft' }));

    expect(await publishedAtOf(post.id)).toBeUndefined();
    expect(unpublished.publishedAt).toBeNull();
  });

  it('is kept when a published post is edited without changing its status', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    const original = new Date('2026-02-01T00:00:00Z');
    const post = await makePost(author, community, { publishedAt: original });
    vi.setSystemTime(new Date('2026-05-05T00:00:00Z'));

    await updatePost(author, post.id, updatePostSchema.parse({ title: 'A better title' }));

    expect(await publishedAtOf(post.id)).toEqual(original);
  });

  it('is reset on every draft-to-published transition', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community, { publishedAt: new Date('2026-01-01T00:00:00Z') });

    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    await updatePost(author, post.id, updatePostSchema.parse({ status: 'draft' }));
    vi.setSystemTime(new Date('2026-07-01T00:00:00Z'));
    await updatePost(author, post.id, updatePostSchema.parse({ status: 'published' }));

    expect(await publishedAtOf(post.id)).toEqual(new Date('2026-07-01T00:00:00Z'));
  });
});
