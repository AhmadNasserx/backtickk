import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { Types } from 'mongoose';
import { auth } from '@/auth';
import { connectDB, isObjectId } from '@/lib/db';
import { forbidden, unauthorized } from '@/lib/errors';
import { User } from '@/models/user';
import type { SessionUser, UserRole } from '@/types';

interface SessionUserRow {
  name: string;
  username: string;
  image?: string | null;
  role: UserRole;
}

/**
 * The signed-in user, re-read from the database so role and username changes apply
 * without waiting for a new sign-in. Memoised per request by React `cache`.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !isObjectId(id)) return null;

  await connectDB();
  const row = await User.findById(id).select('name username image role').lean<SessionUserRow>();
  if (!row) return null;

  return {
    id,
    name: row.name,
    username: row.username,
    image: row.image ?? null,
    role: row.role,
  };
});

/** For Route Handlers and services: 401 when there is no valid session. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw unauthorized();
  }
  return user;
}

/** For pages: sends anonymous visitors to sign-in and back to `callbackUrl` afterwards. */
export async function requireUserOrRedirect(callbackUrl: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return user;
}

export function canModify(user: Pick<SessionUser, 'id' | 'role'>, ownerId: string | Types.ObjectId): boolean {
  return user.role === 'admin' || user.id === String(ownerId);
}

/** Owners and admins may modify a resource; everyone else gets 403. */
export function assertCanModify(user: Pick<SessionUser, 'id' | 'role'>, ownerId: string | Types.ObjectId): void {
  if (!canModify(user, ownerId)) {
    throw forbidden();
  }
}
