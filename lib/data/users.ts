import type { Types } from 'mongoose';
import { assertObjectId, connectDB, isDuplicateKeyError, isObjectId } from '@/lib/db';
import { conflict, notFound } from '@/lib/errors';
import { toPublicProfile, toUserDTO, type LeanFullUser, type LeanPublicUser } from '@/lib/serialize';
import { User } from '@/models/user';
import { USERNAME_PATTERN, isReservedUsername, type UpdateProfileInput } from '@/schemas/profile';
import type { PublicProfileDTO, SessionUser, UserDTO, UserRole } from '@/types';

export const OAUTH_PROVIDERS = ['github', 'google'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export interface OAuthProfileInput {
  provider: OAuthProvider;
  providerAccountId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  /** GitHub login, used as the preferred username base. */
  login: string | null;
}

interface UserRow extends LeanFullUser {
  _id: Types.ObjectId;
}

const MAX_UPSERT_ATTEMPTS = 3;
const MAX_USERNAME_SUFFIX = 50;

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function toSessionUser(row: { _id: Types.ObjectId; name: string; username: string; image?: string | null; role: UserRole }): SessionUser {
  return {
    id: row._id.toString(),
    name: row.name,
    username: row.username,
    image: row.image ?? null,
    role: row.role,
  };
}

/** Lowercase, `[a-z0-9_-]` only, 3-24 characters so a numeric suffix still fits in 30. */
function usernameBase(raw: string): string {
  const base = raw
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
    .replace(/-+$/, '');
  return base.length >= 3 ? base : 'user';
}

async function isUsernameFree(candidate: string): Promise<boolean> {
  if (!USERNAME_PATTERN.test(candidate) || isReservedUsername(candidate)) return false;
  return !(await User.exists({ username: candidate }));
}

async function generateUsername(profile: OAuthProfileInput): Promise<string> {
  const emailLocalPart = profile.email?.split('@')[0] ?? null;
  const base = usernameBase(profile.login ?? emailLocalPart ?? profile.name ?? 'user');

  if (await isUsernameFree(base)) return base;
  for (let suffix = 2; suffix <= MAX_USERNAME_SUFFIX; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (await isUsernameFree(candidate)) return candidate;
  }
  return `user-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Finds or creates the user for an OAuth identity. Called from the Auth.js jwt callback
 * on sign-in only. The display name is set once at creation so users can rename themselves;
 * image and email follow the provider on every sign-in. ADMIN_EMAILS promotes to admin
 * but never demotes, so roles set by hand in the database are preserved.
 */
export async function upsertOAuthUser(profile: OAuthProfileInput): Promise<SessionUser> {
  await connectDB();

  const email = profile.email?.trim().toLowerCase() || null;
  const promoteToAdmin = email !== null && adminEmails().includes(email);
  const providerName = profile.name?.trim() || profile.login || email?.split('@')[0] || 'Developer';
  const displayName = providerName.slice(0, 80);

  for (let attempt = 1; ; attempt += 1) {
    try {
      const existing = await User.findOne({
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      }).lean<UserRow>();

      if (existing) {
        const set: Record<string, unknown> = {};
        if (profile.image) set.image = profile.image;
        if (email) set.email = email;
        if (promoteToAdmin && existing.role !== 'admin') set.role = 'admin';

        const updated = Object.keys(set).length
          ? await User.findByIdAndUpdate(existing._id, { $set: set }, { returnDocument: 'after' }).lean<UserRow>()
          : existing;
        return toSessionUser(updated ?? existing);
      }

      const created = await User.create({
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        name: displayName,
        email: email ?? undefined,
        image: profile.image ?? undefined,
        username: await generateUsername(profile),
        role: promoteToAdmin ? 'admin' : 'user',
      });
      return toSessionUser(created);
    } catch (error) {
      // Two concurrent first sign-ins can race on a unique index; the retry sees the winner's row.
      if (isDuplicateKeyError(error) && attempt < MAX_UPSERT_ATTEMPTS) continue;
      throw error;
    }
  }
}

export async function getPublicProfileByUsername(username: string): Promise<PublicProfileDTO | null> {
  const normalized = username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(normalized)) return null;

  await connectDB();
  const row = await User.findOne({ username: normalized })
    .select('name username image bio skills createdAt')
    .lean<LeanPublicUser>();
  return row ? toPublicProfile(row) : null;
}

/** Current username and role for the session token; null if the user no longer exists. */
export async function getSessionUserById(id: string): Promise<SessionUser | null> {
  if (!isObjectId(id)) return null;
  await connectDB();
  const row = await User.findById(id)
    .select('name username image role')
    .lean<{ _id: Types.ObjectId; name: string; username: string; image?: string | null; role: UserRole }>();
  return row ? toSessionUser(row) : null;
}

/** The signed-in user's own record, including email (never use this for public output). */
export async function getUserDTOById(id: string): Promise<UserDTO | null> {
  assertObjectId(id, 'user id');
  await connectDB();
  const row = await User.findById(id).lean<LeanFullUser>();
  return row ? toUserDTO(row) : null;
}

export async function updateProfile(user: SessionUser, input: UpdateProfileInput): Promise<UserDTO> {
  assertObjectId(user.id, 'user id');
  await connectDB();

  const takenByOther = await User.exists({ username: input.username, _id: { $ne: user.id } });
  if (takenByOther) {
    throw usernameTaken();
  }

  try {
    const updated = await User.findByIdAndUpdate(
      user.id,
      { $set: { name: input.name, username: input.username, bio: input.bio, skills: input.skills } },
      { returnDocument: 'after', runValidators: true },
    ).lean<LeanFullUser>();
    if (!updated) {
      throw notFound('User not found');
    }
    return toUserDTO(updated);
  } catch (error) {
    // Lost a race with another user claiming the same username between the check and the write.
    if (isDuplicateKeyError(error)) throw usernameTaken();
    throw error;
  }
}

function usernameTaken() {
  return conflict('Username is already taken', { fieldErrors: { username: ['Username is already taken'] } });
}
