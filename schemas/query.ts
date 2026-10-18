import { z } from 'zod';

/*
 * List query schemas are lenient: an invalid or out-of-range value falls back
 * to its default instead of failing, so a malformed URL never crashes a page.
 * The search query `q` is the exception because it is required.
 */

const MAX_PAGE_SIZE = 50;

const page = z.coerce.number().int().min(1).catch(1);

function pageSize(defaultSize: number) {
  return z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .catch(defaultSize);
}

/** Optional free-text / slug filter: missing, invalid or blank input becomes undefined. */
function optionalFilter(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .catch(undefined)
    .transform((value) => (value ? value : undefined));
}

const slugFilter = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]+$/)
  .max(100)
  .optional()
  .catch(undefined)
  .transform((value) => (value ? value : undefined));

const usernameFilter = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_-]+$/)
  .max(30)
  .optional()
  .catch(undefined)
  .transform((value) => (value ? value : undefined));

export const paginationQuerySchema = z.object({
  page,
  limit: pageSize(10),
});

export const postsQuerySchema = z.object({
  search: optionalFilter(100),
  community: slugFilter,
  topic: optionalFilter(30).transform((value) => value?.toLowerCase()),
  author: usernameFilter,
  sort: z.enum(['newest', 'oldest']).catch('newest'),
  page,
  limit: pageSize(10),
});

export const communitiesQuerySchema = z.object({
  search: optionalFilter(100),
  topic: optionalFilter(30).transform((value) => value?.toLowerCase()),
  page,
  limit: pageSize(12),
});

/** Strict on purpose: an empty or too-short query has no meaningful default. */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Search needs at least 2 characters').max(100, 'Search is at most 100 characters'),
  page,
  limit: pageSize(10),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PostsQuery = z.infer<typeof postsQuerySchema>;
export type CommunitiesQuery = z.infer<typeof communitiesQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
