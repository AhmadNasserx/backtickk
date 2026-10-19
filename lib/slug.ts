import { randomBytes } from 'node:crypto';

const MAX_SLUG_LENGTH = 80;
const WORDS_PER_MINUTE = 200;

/** Lowercase ASCII slug: diacritics are folded, runs of other characters become a single "-". */
export function slugify(input: string): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '');
  return slug || 'item';
}

interface SlugModel {
  exists(filter: { slug: string }): PromiseLike<unknown>;
}

const MAX_ATTEMPTS = 5;

/**
 * Returns `base` if free, otherwise `base-<random>`. The check is advisory: the unique
 * index on `slug` is the final guard, so a rare race surfaces as a duplicate-key error.
 */
export async function uniqueSlug(model: SlugModel, base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const taken = await model.exists({ slug: candidate });
    if (!taken) return candidate;
    candidate = `${root}-${randomBytes(3).toString('hex')}`;
  }
  return `${root}-${randomBytes(6).toString('hex')}`;
}

/** Minutes to read, at 200 words per minute, never less than one. */
export function readingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
