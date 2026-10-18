import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { assertCanModify, canModify } from '@/lib/auth-helpers';
import { parseJson, parseSearchParams, route } from '@/lib/api';
import { AppError, badRequest, conflict, forbidden, notFound, unauthorized } from '@/lib/errors';
import { escapeRegex } from '@/lib/escape-regex';
import { readingTime, slugify } from '@/lib/slug';
import { paginationQuerySchema } from '@/schemas/query';
import type { SessionUser } from '@/types';

const OWNER_ID = '507f1f77bcf86cd799439011';
const OTHER_ID = '507f1f77bcf86cd799439012';

function viewer(overrides: Partial<SessionUser> = {}): SessionUser {
  return { id: OTHER_ID, username: 'viewer', name: 'Viewer', image: null, role: 'user', ...overrides };
}

describe('slugify', () => {
  it('lowercases and joins words with single dashes', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('  Many   spaces -- and symbols!!  ')).toBe('many-spaces-and-symbols');
  });

  it('folds diacritics to their ASCII letters', () => {
    expect(slugify('Café Crème')).toBe('cafe-creme');
  });

  it('falls back to "item" when nothing usable remains', () => {
    expect(slugify('')).toBe('item');
    expect(slugify('!!!   ')).toBe('item');
    expect(slugify('日本語')).toBe('item');
  });

  it('never exceeds 80 characters and never ends with a dash', () => {
    const slug = slugify('word '.repeat(40));

    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith('-')).toBe(false);
    expect(slug.startsWith('word-word')).toBe(true);
  });
});

describe('readingTime', () => {
  it('is never less than one minute, even for empty content', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime('   ')).toBe(1);
    expect(readingTime('short words only')).toBe(1);
  });

  it('assumes 200 words per minute and rounds up', () => {
    const words = (count: number) => Array.from({ length: count }, () => 'word').join(' ');

    expect(readingTime(words(200))).toBe(1);
    expect(readingTime(words(201))).toBe(2);
    expect(readingTime(words(400))).toBe(2);
    expect(readingTime(words(401))).toBe(3);
  });

  it('counts words separated by any whitespace, including newlines', () => {
    expect(readingTime(Array.from({ length: 300 }, () => 'a').join('\n\n'))).toBe(2);
  });
});

describe('escapeRegex', () => {
  it('escapes every regex metacharacter so the input matches literally', () => {
    const special = '.*+?^${}()|[]\\';

    expect(new RegExp(escapeRegex(special)).test(special)).toBe(true);
    expect(new RegExp(escapeRegex(special)).test('anything else')).toBe(false);
  });

  it('turns a match-everything pattern into a literal dot-star', () => {
    const pattern = new RegExp(escapeRegex('.*'));

    expect(pattern.test('Hello world')).toBe(false);
    expect(pattern.test('a title with .* in it')).toBe(true);
  });

  it('neutralises a catastrophic-backtracking pattern by treating it as plain text', () => {
    const pattern = new RegExp(escapeRegex('(a+)+$'));

    expect(pattern.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!')).toBe(false);
    expect(pattern.test('(a+)+$')).toBe(true);
  });
});

describe('canModify and assertCanModify', () => {
  it('lets the owner modify their own resource', () => {
    const owner = viewer({ id: OWNER_ID });

    expect(canModify(owner, OWNER_ID)).toBe(true);
    expect(canModify(owner, new mongoose.Types.ObjectId(OWNER_ID))).toBe(true);
    expect(() => assertCanModify(owner, OWNER_ID)).not.toThrow();
  });

  it('lets an admin modify anyone else\'s resource', () => {
    const admin = viewer({ role: 'admin' });

    expect(canModify(admin, OWNER_ID)).toBe(true);
    expect(() => assertCanModify(admin, OWNER_ID)).not.toThrow();
  });

  it('denies a non-owner non-admin with a 403 AppError', () => {
    const other = viewer({ id: OTHER_ID });

    expect(canModify(other, OWNER_ID)).toBe(false);
    try {
      assertCanModify(other, OWNER_ID);
      expect.unreachable('assertCanModify should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(403);
    }
  });
});

describe('AppError factories', () => {
  it('carry the HTTP status their name promises', () => {
    expect(badRequest().status).toBe(400);
    expect(unauthorized().status).toBe(401);
    expect(forbidden().status).toBe(403);
    expect(notFound().status).toBe(404);
    expect(conflict('taken').status).toBe(409);
  });
});

describe('route()', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const request = new Request('https://example.test/api/thing');

  it('passes a successful response through unchanged', async () => {
    const handler = route(async () => Response.json({ ok: true }, { status: 201 }));

    const response = await handler(request, undefined);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('turns an AppError into its status with a { error: { message } } body', async () => {
    const handler = route(async () => {
      throw forbidden('Nope');
    });

    const response = await handler(request, undefined);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: { message: 'Nope' } });
  });

  it('includes AppError details only when they were supplied', async () => {
    const handler = route(async () => {
      throw conflict('Username is already taken', { fieldErrors: { username: ['taken'] } });
    });

    const response = await handler(request, undefined);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: { message: 'Username is already taken', details: { fieldErrors: { username: ['taken'] } } },
    });
  });

  it('maps a ZodError to a 400 with flattened field errors', async () => {
    const schema = z.object({ title: z.string().min(5) });
    const handler = route(async () => {
      schema.parse({ title: 'no' });
      return Response.json({});
    });

    const response = await handler(request, undefined);
    const body = (await response.json()) as { error: { message: string; details: { fieldErrors: Record<string, string[]> } } };

    expect(response.status).toBe(400);
    expect(body.error.message).toBe('Validation failed');
    expect(body.error.details.fieldErrors.title).toHaveLength(1);
  });

  it('maps an unknown error to a 500 without leaking its message, and logs it', async () => {
    const handler = route(async () => {
      throw new Error('connection string postgres://user:secret@db');
    });

    const response = await handler(request, undefined);
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(text).toContain('Internal server error');
    expect(text).not.toContain('secret');
    expect(console.error).toHaveBeenCalled();
  });

  it('maps a Mongoose CastError to a 400 "Invalid identifier"', async () => {
    const handler = route(async () => {
      throw new mongoose.Error.CastError('ObjectId', 'nope', '_id');
    });

    const response = await handler(request, undefined);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { message: 'Invalid identifier' } });
  });
});

describe('parseSearchParams and parseJson', () => {
  it('parses query strings through a schema, applying its fallbacks', () => {
    const parsed = parseSearchParams('https://example.test/api/posts?page=2&limit=500', paginationQuerySchema);

    expect(parsed).toEqual({ page: 2, limit: 10 });
  });

  it('uses the last value when a query key is repeated', () => {
    const parsed = parseSearchParams('https://example.test/api?page=2&page=5', paginationQuerySchema);

    expect(parsed.page).toBe(5);
  });

  it('throws the ZodError when a strict schema rejects the query', () => {
    const strict = z.object({ q: z.string().min(2) });

    expect(() => parseSearchParams('https://example.test/api', strict)).toThrow(z.ZodError);
  });

  it('turns invalid JSON into a 400 with a clear message', async () => {
    const request = new Request('https://example.test/api', { method: 'POST', body: '{not json' });

    await expect(parseJson(request, z.object({}))).rejects.toMatchObject({ status: 400, message: 'Request body must be valid JSON' });
  });

  it('validates a JSON body against the schema and returns parsed data', async () => {
    const request = new Request('https://example.test/api', { method: 'POST', body: JSON.stringify({ name: ' Ada ' }) });
    const schema = z.object({ name: z.string().trim() });

    await expect(parseJson(request, schema)).resolves.toEqual({ name: 'Ada' });
  });
});
