import { z } from 'zod';

export const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;

export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'admin',
  'api',
  'settings',
  'create',
  'dashboard',
  'signin',
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_PATTERN, 'Use 3-30 lowercase letters, digits, "-" or "_"')
  .refine((value) => !isReservedUsername(value), 'This username is reserved');

const skillSchema = z.string().trim().min(1, 'Skills cannot be empty').max(30, 'Each skill is at most 30 characters');

/** Drops case-insensitive duplicates while keeping the first spelling. */
function dedupeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  return skills.filter((skill) => {
    const key = skill.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is at most 80 characters'),
  username: usernameSchema,
  bio: z.string().trim().max(280, 'Bio is at most 280 characters').default(''),
  skills: z
    .array(skillSchema)
    .max(15, 'At most 15 skills')
    .transform(dedupeSkills)
    .default([]),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
