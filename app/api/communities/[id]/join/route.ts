import { revalidatePath } from 'next/cache';
import { json, route } from '@/lib/api';
import { requireUser } from '@/lib/auth-helpers';
import { getCommunityById, joinCommunity, leaveCommunity } from '@/lib/data/communities';
import type { CommunityDTO, MembershipDTO, SessionUser } from '@/types';

interface IdContext {
  params: Promise<{ id: string }>;
}

/** Membership changes the member count (community header, listings) and the user's joined list on their profile. */
async function revalidateMembership(user: SessionUser, communityId: string): Promise<void> {
  const community: CommunityDTO | null = await getCommunityById(communityId);
  if (community) {
    revalidatePath(`/communities/${community.slug}`);
  }
  revalidatePath('/communities');
  revalidatePath('/');
  revalidatePath(`/profile/${user.username}`);
}

export const POST = route<IdContext>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const membership: MembershipDTO = await joinCommunity(user, id);
  await revalidateMembership(user, id);
  return json(membership);
});

export const DELETE = route<IdContext>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const membership: MembershipDTO = await leaveCommunity(user, id);
  await revalidateMembership(user, id);
  return json(membership);
});
