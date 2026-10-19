import { describe, expect, it } from 'vitest';
import { createCommentSchema } from '@/schemas/comment';
import { createPostSchema, updatePostSchema } from '@/schemas/post';
import {
  communitiesQuerySchema,
  paginationQuerySchema,
  postsQuerySchema,
  searchQuerySchema,
} from '@/schemas/query';
import { isReservedUsername, updateProfileSchema, usernameSchema } from '@/schemas/profile';

const COMMUNITY_ID = '507f1f77bcf86cd799439011';

function validPost(overrides: Record<string, unknown> = {}) {
  return {
    title: 'A perfectly valid title',
    excerpt: 'A short excerpt',
    content: 'This content is comfortably longer than twenty characters.',
    communityId: COMMUNITY_ID,
    ...overrides,
  };
}

function messagesOf(result: { success: boolean; error?: { issues: { message: string }[] } }): string[] {
  return result.error?.issues.map((issue) => issue.message) ?? [];
}

describe('createPostSchema', () => {
  it('accepts a minimal valid post and fills in the defaults', () => {
    const result = createPostSchema.parse(validPost());

    expect(result.tags).toEqual([]);
    expect(result.status).toBeUndefined();
    expect(result.coverImage).toBeUndefined();
  });

  it('trims the title and rejects titles shorter than 5 characters after trimming', () => {
    expect(createPostSchema.parse(validPost({ title: '   Padded   ' })).title).toBe('Padded');

    const result = createPostSchema.safeParse(validPost({ title: '   abcd   ' }));
    expect(result.success).toBe(false);
    expect(messagesOf(result)).toContain('Title is at least 5 characters');
  });

  it('enforces the title, excerpt and content length limits', () => {
    expect(createPostSchema.safeParse(validPost({ title: 'a'.repeat(120) })).success).toBe(true);
    expect(createPostSchema.safeParse(validPost({ title: 'a'.repeat(121) })).success).toBe(false);

    expect(createPostSchema.safeParse(validPost({ excerpt: '' })).success).toBe(false);
    expect(createPostSchema.safeParse(validPost({ excerpt: 'e'.repeat(240) })).success).toBe(true);
    expect(createPostSchema.safeParse(validPost({ excerpt: 'e'.repeat(241) })).success).toBe(false);

    expect(createPostSchema.safeParse(validPost({ content: 'c'.repeat(19) })).success).toBe(false);
    expect(createPostSchema.safeParse(validPost({ content: 'c'.repeat(20000) })).success).toBe(true);
    expect(createPostSchema.safeParse(validPost({ content: 'c'.repeat(20001) })).success).toBe(false);
  });

  it('requires a 24-character hex community id', () => {
    expect(createPostSchema.safeParse(validPost({ communityId: 'not-an-id' })).success).toBe(false);
    expect(createPostSchema.safeParse(validPost({ communityId: '507f1f77bcf86cd79943901z' })).success).toBe(false);
  });

  it('normalises tags to trimmed lowercase and drops duplicates, keeping the first position', () => {
    const result = createPostSchema.parse(validPost({ tags: ['  TypeScript ', 'react', 'typescript', 'REACT', 'nextjs'] }));

    expect(result.tags).toEqual(['typescript', 'react', 'nextjs']);
  });

  it('allows at most 5 tags', () => {
    expect(createPostSchema.safeParse(validPost({ tags: ['a1', 'b2', 'c3', 'd4', 'e5'] })).success).toBe(true);
    expect(createPostSchema.safeParse(validPost({ tags: ['a1', 'b2', 'c3', 'd4', 'e5', 'f6'] })).success).toBe(false);
  });

  it('rejects tags that are too short, too long, or use characters outside the allowed set', () => {
    expect(createPostSchema.safeParse(validPost({ tags: ['a'] })).success).toBe(false);
    expect(createPostSchema.safeParse(validPost({ tags: ['a'.repeat(31)] })).success).toBe(false);
    expect(createPostSchema.safeParse(validPost({ tags: ['hello world'] })).success).toBe(false);
    expect(createPostSchema.safeParse(validPost({ tags: ['<script>'] })).success).toBe(false);
  });

  /*
   * Business rule: "at most 5 tags" counts distinct tags. Duplicates are removed before the limit is checked,
   * so five distinct tags plus one repeat are accepted.
   */
  it('counts distinct tags, not raw entries, against the 5-tag limit', () => {
    expect(createPostSchema.safeParse(validPost({ tags: ['react', 'react', 'next', 'ts', 'node', 'go'] })).success).toBe(true);
  });

  it('still rejects six distinct tags even when some entries repeat', () => {
    const result = createPostSchema.safeParse(validPost({ tags: ['react', 'react', 'next', 'ts', 'node', 'go', 'rust'] }));

    expect(result.success).toBe(false);
    expect(messagesOf(result)).toContain('At most 5 tags');
  });

  it('allows the tag punctuation used by real topics: + # . and -', () => {
    expect(createPostSchema.safeParse(validPost({ tags: ['c++', 'c#', 'node.js', 'front-end'] })).success).toBe(true);
  });

  it('accepts an empty or http(s) cover image and rejects other schemes', () => {
    expect(createPostSchema.safeParse(validPost({ coverImage: '' })).success).toBe(true);
    expect(createPostSchema.safeParse(validPost({ coverImage: 'https://cdn.example.com/a.png' })).success).toBe(true);
    expect(createPostSchema.safeParse(validPost({ coverImage: 'http://cdn.example.com/a.png' })).success).toBe(true);
    expect(createPostSchema.safeParse(validPost({ coverImage: 'javascript:alert(1)' })).success).toBe(false);
    expect(createPostSchema.safeParse(validPost({ coverImage: 'ftp://example.com/a.png' })).success).toBe(false);
    expect(createPostSchema.safeParse(validPost({ coverImage: 'not a url' })).success).toBe(false);
  });

  it('accepts only the known statuses', () => {
    expect(createPostSchema.safeParse(validPost({ status: 'draft' })).success).toBe(true);
    expect(createPostSchema.safeParse(validPost({ status: 'published' })).success).toBe(true);
    expect(createPostSchema.safeParse(validPost({ status: 'archived' })).success).toBe(false);
  });
});

describe('updatePostSchema', () => {
  it('rejects an empty update', () => {
    const result = updatePostSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(messagesOf(result)).toContain('Provide at least one field to update');
  });

  it('accepts a single-field update and does not invent defaults for the other fields', () => {
    const result = updatePostSchema.parse({ title: 'Only the title changes' });

    expect(Object.keys(result)).toEqual(['title']);
  });

  it('applies the same field rules as creation to the fields it does receive', () => {
    expect(updatePostSchema.safeParse({ title: 'abc' }).success).toBe(false);
    expect(updatePostSchema.safeParse({ tags: ['ok', 'Ok'] }).data).toEqual({ tags: ['ok'] });
    expect(updatePostSchema.safeParse({ coverImage: '' }).success).toBe(true);
  });
});

describe('createCommentSchema', () => {
  it('trims comment content', () => {
    expect(createCommentSchema.parse({ content: '  Nice post  ' }).content).toBe('Nice post');
  });

  it('rejects empty and whitespace-only comments', () => {
    expect(createCommentSchema.safeParse({ content: '' }).success).toBe(false);
    expect(createCommentSchema.safeParse({ content: '     ' }).success).toBe(false);
  });

  it('allows up to 1000 characters and rejects 1001', () => {
    expect(createCommentSchema.safeParse({ content: 'x'.repeat(1000) }).success).toBe(true);
    expect(createCommentSchema.safeParse({ content: 'x'.repeat(1001) }).success).toBe(false);
  });
});

describe('usernameSchema and reserved usernames', () => {
  it('lowercases usernames before checking them', () => {
    expect(usernameSchema.parse('  Ada_Lovelace ')).toBe('ada_lovelace');
  });

  it('requires 3 to 30 characters from the allowed set', () => {
    expect(usernameSchema.safeParse('ab').success).toBe(false);
    expect(usernameSchema.safeParse('a'.repeat(3)).success).toBe(true);
    expect(usernameSchema.safeParse('a'.repeat(30)).success).toBe(true);
    expect(usernameSchema.safeParse('a'.repeat(31)).success).toBe(false);
    expect(usernameSchema.safeParse('has space').success).toBe(false);
    expect(usernameSchema.safeParse('dots.not.allowed').success).toBe(false);
  });

  it('reserves route names regardless of case', () => {
    for (const name of ['admin', 'api', 'settings', 'create', 'dashboard', 'signin']) {
      expect(isReservedUsername(name)).toBe(true);
    }
    expect(isReservedUsername('Admin')).toBe(true);
    expect(usernameSchema.safeParse('Dashboard').success).toBe(false);
    expect(isReservedUsername('adatalks')).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  const valid = { name: 'Ada', username: 'ada' };

  it('fills bio and skills with empty defaults', () => {
    expect(updateProfileSchema.parse(valid)).toEqual({ name: 'Ada', username: 'ada', bio: '', skills: [] });
  });

  it('requires a non-blank name of at most 80 characters', () => {
    expect(updateProfileSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ ...valid, name: 'n'.repeat(80) }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ ...valid, name: 'n'.repeat(81) }).success).toBe(false);
  });

  it('rejects a reserved username during profile edits', () => {
    const result = updateProfileSchema.safeParse({ ...valid, username: 'settings' });

    expect(result.success).toBe(false);
    expect(messagesOf(result)).toContain('This username is reserved');
  });

  it('limits bio to 280 characters', () => {
    expect(updateProfileSchema.safeParse({ ...valid, bio: 'b'.repeat(280) }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ ...valid, bio: 'b'.repeat(281) }).success).toBe(false);
  });

  it('drops case-insensitive duplicate skills and keeps the first spelling', () => {
    const result = updateProfileSchema.parse({ ...valid, skills: ['React', 'react', ' REACT ', 'Go'] });

    expect(result.skills).toEqual(['React', 'Go']);
  });

  /*
   * Business rule: "at most 15 skills" counts distinct skills. Duplicates (case-insensitive) are removed
   * before the limit is checked, so fifteen distinct skills plus one repeat are accepted.
   */
  it('counts distinct skills, not raw entries, against the 15-skill limit', () => {
    const fifteen = Array.from({ length: 15 }, (_, index) => `skill${index}`);

    expect(updateProfileSchema.safeParse({ ...valid, skills: [...fifteen, 'skill0'] }).success).toBe(true);
  });

  it('allows at most 15 skills, each non-empty and at most 30 characters', () => {
    const fifteen = Array.from({ length: 15 }, (_, index) => `skill${index}`);
    expect(updateProfileSchema.safeParse({ ...valid, skills: fifteen }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ ...valid, skills: [...fifteen, 'one-more'] }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ ...valid, skills: ['   '] }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ ...valid, skills: ['s'.repeat(31)] }).success).toBe(false);
  });
});

describe('list query schemas are lenient', () => {
  it('falls back to defaults for missing or malformed pagination values', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 10 });
    expect(paginationQuerySchema.parse({ page: 'abc', limit: 'lots' })).toEqual({ page: 1, limit: 10 });
    expect(paginationQuerySchema.parse({ page: '0' })).toEqual({ page: 1, limit: 10 });
    expect(paginationQuerySchema.parse({ page: '2.5' })).toEqual({ page: 1, limit: 10 });
  });

  it('keeps valid pagination values and falls back to the default for an oversized limit', () => {
    expect(paginationQuerySchema.parse({ page: '3', limit: '25' })).toEqual({ page: 3, limit: 25 });
    expect(paginationQuerySchema.parse({ limit: '500' })).toEqual({ page: 1, limit: 10 });
    expect(paginationQuerySchema.parse({ limit: '0' })).toEqual({ page: 1, limit: 10 });
  });

  it('defaults post listings to the newest first', () => {
    expect(postsQuerySchema.parse({})).toEqual({
      search: undefined,
      community: undefined,
      topic: undefined,
      author: undefined,
      sort: 'newest',
      page: 1,
      limit: 10,
    });
    expect(postsQuerySchema.parse({ sort: 'oldest' }).sort).toBe('oldest');
    expect(postsQuerySchema.parse({ sort: 'random' }).sort).toBe('newest');
  });

  it('drops invalid post filters instead of failing the request', () => {
    const parsed = postsQuerySchema.parse({ community: 'Bad Slug!', author: 'ada space', search: '   ' });

    expect(parsed.community).toBeUndefined();
    expect(parsed.author).toBeUndefined();
    expect(parsed.search).toBeUndefined();
  });

  it('normalises valid post filters', () => {
    const parsed = postsQuerySchema.parse({ community: 'Dev-Talks', author: 'Ada', topic: 'React', search: '  hooks  ' });

    expect(parsed.community).toBe('dev-talks');
    expect(parsed.author).toBe('ada');
    expect(parsed.topic).toBe('react');
    expect(parsed.search).toBe('hooks');
  });

  it('drops a search term longer than 100 characters rather than truncating it', () => {
    expect(postsQuerySchema.parse({ search: 'x'.repeat(101) }).search).toBeUndefined();
    expect(postsQuerySchema.parse({ search: 'x'.repeat(100) }).search).toBe('x'.repeat(100));
  });

  it('uses a 12-item default page for communities', () => {
    expect(communitiesQuerySchema.parse({})).toMatchObject({ page: 1, limit: 12 });
    expect(communitiesQuerySchema.parse({ topic: 'AI' })).toMatchObject({ topic: 'ai' });
  });
});

describe('searchQuerySchema (strict q)', () => {
  it('requires q', () => {
    expect(searchQuerySchema.safeParse({}).success).toBe(false);
  });

  it('requires at least 2 characters after trimming', () => {
    expect(searchQuerySchema.safeParse({ q: '' }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: 'a' }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: '  a  ' }).success).toBe(false);
    expect(searchQuerySchema.parse({ q: '  ab  ' }).q).toBe('ab');
  });

  it('rejects a query longer than 100 characters instead of truncating it', () => {
    expect(searchQuerySchema.safeParse({ q: 'q'.repeat(101) }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: 'q'.repeat(100) }).success).toBe(true);
  });

  it('still falls back leniently for page and limit', () => {
    expect(searchQuerySchema.parse({ q: 'react', page: 'bogus', limit: '999' })).toEqual({ q: 'react', page: 1, limit: 10 });
  });
});
