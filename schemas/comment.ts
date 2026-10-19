import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment is at most 1000 characters'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
