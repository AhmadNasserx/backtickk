import { z } from 'zod';
import { POST_STATUSES } from '@/types';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Tags are at least 2 characters')
  .max(30, 'Tags are at most 30 characters')
  .regex(/^[a-z0-9+#.-]+$/, 'Tags may contain letters, digits, + # . and -');

/*
 * Tags are normalised and de-duplicated before the item rules and the max-count check run, so the
 * limit counts distinct tags. Duplicates keep their first position.
 */
function normaliseAndDedupeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()))];
}

/*
 * Field definitions carry no defaults on purpose: `.partial()` would otherwise turn a
 * default into a synthetic key, and the "at least one field" check on updates would never fail.
 */
const postFields = {
  title: z.string().trim().min(5, 'Title is at least 5 characters').max(120, 'Title is at most 120 characters'),
  excerpt: z.string().trim().min(1, 'Excerpt is required').max(240, 'Excerpt is at most 240 characters'),
  content: z
    .string()
    .trim()
    .min(20, 'Content is at least 20 characters')
    .max(20000, 'Content is at most 20000 characters'),
  communityId: z.string().regex(OBJECT_ID_PATTERN, 'Invalid community id'),
  tags: z
    .array(z.string())
    .transform(normaliseAndDedupeTags)
    .pipe(z.array(tagSchema).max(5, 'At most 5 tags')),
  coverImage: z
    .union([z.url({ protocol: /^https?$/ }), z.literal('')], 'Cover image must be an http(s) URL')
    .optional(),
  status: z.enum(POST_STATUSES).optional(),
};

export const createPostSchema = z.object({
  ...postFields,
  tags: postFields.tags.default([]),
});

export const updatePostSchema = z
  .object(postFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
