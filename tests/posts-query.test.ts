import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { addBookmark, isBookmarked, listBookmarks, removeBookmark } from '@/lib/data/bookmarks';
import { createComment, listComments } from '@/lib/data/comments';
import { listPosts } from '@/lib/data/posts';
import { createCommentSchema } from '@/schemas/comment';
import { Post } from '@/models/post';
import type { SessionUser } from '@/types';
import { expectStatus } from './setup/assertions';
import {
  clearDb,
  makeComment,
  makeCommunity,
  makePost,
  makeUser,
  newObjectId,
  startDb,
  stopDb,
  type CommunityFixture,
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

const DAY = 24 * 60 * 60 * 1000;
const EPOCH = Date.UTC(2026, 0, 1);

function day(offset: number): Date {
  return new Date(EPOCH + offset * DAY);
}

function titlesOf(result: { items: { title: string }[] }): string[] {
  return result.items.map((item) => item.title);
}

describe('listing published posts', () => {
  interface Seed {
    ada: SessionUser;
    grace: SessionUser;
    frontend: CommunityFixture;
    backend: CommunityFixture;
  }

  async function seed(): Promise<Seed> {
    const ada = await makeUser({ username: 'ada', name: 'Ada' });
    const grace = await makeUser({ username: 'grace', name: 'Grace' });
    const frontend = await makeCommunity({ slug: 'frontend' });
    const backend = await makeCommunity({ slug: 'backend' });

    await makePost(ada, frontend, {
      title: 'React hooks deep dive',
      tags: ['react'],
      publishedAt: day(1),
    });
    await makePost(ada, backend, {
      title: 'Node streams explained',
      tags: ['node'],
      publishedAt: day(2),
    });
    await makePost(grace, frontend, {
      title: 'Typescript generics',
      excerpt: 'Mostly about react typing patterns',
      tags: ['react', 'typescript'],
      publishedAt: day(3),
    });
    await makePost(ada, frontend, {
      title: 'Unfinished React draft',
      tags: ['react'],
      status: 'draft',
    });

    return { ada, grace, frontend, backend };
  }

  it('filters by community slug and leaves out drafts for anonymous viewers', async () => {
    const { frontend } = await seed();

    const result = await listPosts({ community: frontend.slug });

    expect(titlesOf(result).sort()).toEqual(['React hooks deep dive', 'Typescript generics']);
  });

  it('returns an empty page with zero pages for an unknown community slug', async () => {
    await seed();

    const result = await listPosts({ community: 'no-such-community' });

    expect(result).toMatchObject({ items: [], total: 0, totalPages: 0 });
  });

  it('filters by topic, ignoring the topic\'s case, and excludes drafts', async () => {
    await seed();

    const result = await listPosts({ topic: 'REACT' });

    expect(titlesOf(result).sort()).toEqual(['React hooks deep dive', 'Typescript generics']);
  });

  it('filters by author username', async () => {
    await seed();

    const result = await listPosts({ author: 'ada' });

    expect(titlesOf(result).sort()).toEqual(['Node streams explained', 'React hooks deep dive']);
  });

  it('returns an empty page for an unknown author', async () => {
    await seed();

    expect((await listPosts({ author: 'nobody-here' })).total).toBe(0);
  });

  it('includes the author\'s own drafts in their own author listing', async () => {
    const { ada } = await seed();

    const result = await listPosts({ author: 'ada' }, ada);

    expect(titlesOf(result).sort()).toEqual(['Node streams explained', 'React hooks deep dive', 'Unfinished React draft']);
  });

  it('keeps another user\'s drafts out of an author listing', async () => {
    const { grace } = await seed();

    const result = await listPosts({ author: 'ada' }, grace);

    expect(titlesOf(result)).not.toContain('Unfinished React draft');
  });

  it('searches title, excerpt and tags, case-insensitively', async () => {
    await seed();

    const byTitle = await listPosts({ search: 'STREAMS' });
    const byExcerpt = await listPosts({ search: 'typing patterns' });
    const byTag = await listPosts({ search: 'react' });

    expect(titlesOf(byTitle)).toEqual(['Node streams explained']);
    expect(titlesOf(byExcerpt)).toEqual(['Typescript generics']);
    expect(titlesOf(byTag).sort()).toEqual(['React hooks deep dive', 'Typescript generics']);
  });

  it('sorts newest first by default and oldest first on request', async () => {
    await seed();

    expect(titlesOf(await listPosts({}))).toEqual([
      'Typescript generics',
      'Node streams explained',
      'React hooks deep dive',
    ]);
    expect(titlesOf(await listPosts({ sort: 'oldest' }))).toEqual([
      'React hooks deep dive',
      'Node streams explained',
      'Typescript generics',
    ]);
  });

  it('combines filters: community and topic together narrow the result', async () => {
    const { frontend } = await seed();

    const result = await listPosts({ community: frontend.slug, topic: 'typescript' });

    expect(titlesOf(result)).toEqual(['Typescript generics']);
  });
});

describe('listing pagination', () => {
  it('reports total and totalPages, pages through the results, and returns an empty page past the end', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    for (let index = 0; index < 25; index += 1) {
      await makePost(author, community, { title: `Paged post number ${index}`, publishedAt: day(index) });
    }

    const first = await listPosts({ page: 1, limit: 10 });
    const last = await listPosts({ page: 3, limit: 10 });
    const past = await listPosts({ page: 4, limit: 10 });

    expect(first).toMatchObject({ page: 1, limit: 10, total: 25, totalPages: 3 });
    expect(first.items).toHaveLength(10);
    expect(last.items).toHaveLength(5);
    expect(past.items).toEqual([]);
    expect(past.total).toBe(25);
  });

  it('does not let drafts inflate the total seen by anonymous viewers', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    await makePost(author, community, { status: 'published' });
    await makePost(author, community, { status: 'draft' });
    await makePost(author, community, { status: 'draft' });

    expect((await listPosts({})).total).toBe(1);
    expect((await listPosts({}, author)).total).toBe(1);
    expect((await listPosts({ author: author.username }, author)).total).toBe(3);
  });

  it('clamps the page size to 50 in the service, whatever the caller asks for', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    await makePost(author, community);

    const result = await listPosts({ limit: 500 });

    expect(result.limit).toBe(50);
  });

  it('uses the default page size of 10 when no limit is given', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    for (let index = 0; index < 11; index += 1) {
      await makePost(author, community, { publishedAt: day(index) });
    }

    const result = await listPosts({});

    expect(result).toMatchObject({ limit: 10, total: 11, totalPages: 2 });
  });
});

describe('searching posts', () => {
  it('treats regex metacharacters as literal text', async () => {
    const author = await makeUser();
    const community = await makeCommunity();
    await makePost(author, community, { title: 'Literal .* marker in a title' });
    await makePost(author, community, { title: 'Plain title without markers' });

    expect(titlesOf(await listPosts({ search: '.*' }))).toEqual(['Literal .* marker in a title']);
    expect((await listPosts({ search: '.' })).total).toBe(1);
    expect((await listPosts({ search: '(a+)+$' })).total).toBe(0);
  });
});

describe('bookmarks', () => {
  it('adding the same bookmark twice leaves one bookmark row', async () => {
    const author = await makeUser();
    const reader = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community);

    expect(await addBookmark(reader, post.id)).toEqual({ bookmarked: true });
    expect(await addBookmark(reader, post.id)).toEqual({ bookmarked: true });

    expect(await isBookmarked(reader.id, post.id)).toBe(true);
    expect((await listBookmarks(reader.id)).total).toBe(1);
  });

  it('removing a bookmark twice is a no-op the second time', async () => {
    const author = await makeUser();
    const reader = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community);
    await addBookmark(reader, post.id);

    expect(await removeBookmark(reader, post.id)).toEqual({ bookmarked: false });
    expect(await removeBookmark(reader, post.id)).toEqual({ bookmarked: false });
    expect(await isBookmarked(reader.id, post.id)).toBe(false);
  });

  it('keeps bookmarks private to each user', async () => {
    const author = await makeUser();
    const reader = await makeUser();
    const other = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community);
    await addBookmark(reader, post.id);

    expect(await isBookmarked(other.id, post.id)).toBe(false);
    expect((await listBookmarks(other.id)).total).toBe(0);
  });

  it('lists bookmarks newest first and paginates them', async () => {
    const author = await makeUser();
    const reader = await makeUser();
    const community = await makeCommunity();
    const posts: string[] = [];
    for (let index = 0; index < 12; index += 1) {
      const post = await makePost(author, community, { title: `Bookmarked post ${index}` });
      posts.push(post.id);
      await addBookmark(reader, post.id);
    }

    const first = await listBookmarks(reader.id, { page: 1, limit: 5 });
    const last = await listBookmarks(reader.id, { page: 3, limit: 5 });

    expect(first).toMatchObject({ total: 12, totalPages: 3, page: 1, limit: 5 });
    expect(first.items.map((item) => item.id)).toEqual(posts.slice().reverse().slice(0, 5));
    expect(last.items.map((item) => item.id)).toEqual(posts.slice().reverse().slice(10));
  });

  it('keeps a bookmark row for a post that was deleted elsewhere out of the list, without crashing', async () => {
    const author = await makeUser();
    const reader = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community);
    await addBookmark(reader, post.id);
    await Post.deleteOne({ _id: post.id });

    const page = await listBookmarks(reader.id);

    expect(page.items).toEqual([]);
  });

  it('refuses to bookmark a post that does not exist', async () => {
    const reader = await makeUser();

    await expectStatus(addBookmark(reader, newObjectId()), 404);
  });
});

describe('comments pagination', () => {
  it('returns the oldest comments first, paginated, with totals', async () => {
    const author = await makeUser();
    const commenter = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community);
    const ids: string[] = [];
    for (let index = 0; index < 25; index += 1) {
      ids.push(await makeComment(post, commenter, `Comment ${index}`, new Date(EPOCH + index * 1000)));
    }

    const second = await listComments(post.id, { page: 2, limit: 10 });
    const third = await listComments(post.id, { page: 3, limit: 10 });

    expect(second).toMatchObject({ total: 25, totalPages: 3, page: 2 });
    expect(second.items.map((item) => item.id)).toEqual(ids.slice(10, 20));
    expect(third.items.map((item) => item.id)).toEqual(ids.slice(20));
  });

  it('uses 20 comments per page by default', async () => {
    const author = await makeUser();
    const commenter = await makeUser();
    const community = await makeCommunity();
    const post = await makePost(author, community);
    for (let index = 0; index < 21; index += 1) {
      await makeComment(post, commenter, `Comment ${index}`, new Date(EPOCH + index * 1000));
    }

    const result = await listComments(post.id);

    expect(result).toMatchObject({ limit: 20, total: 21, totalPages: 2 });
    expect(result.items).toHaveLength(20);
  });

  it('lets a commenter add a comment that then shows up with the author attached', async () => {
    const author = await makeUser();
    const commenter = await makeUser({ name: 'Commenter Name' });
    const community = await makeCommunity();
    const post = await makePost(author, community);

    const created = await createComment(commenter, post.id, createCommentSchema.parse({ content: '  Thanks!  ' }));

    expect(created.content).toBe('Thanks!');
    expect(created.author.name).toBe('Commenter Name');
    expect((await listComments(post.id)).total).toBe(1);
  });
});
