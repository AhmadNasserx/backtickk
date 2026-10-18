import { json, route } from '@/lib/api';
import { requireUser } from '@/lib/auth-helpers';
import { listUserCommunities } from '@/lib/data/communities';

/** Ids of the communities the signed-in user has joined, so a listing page needs one request instead of one per card. */
export const GET = route(async () => {
  const user = await requireUser();
  const communities = await listUserCommunities(user.id);
  return json({ ids: communities.map((community) => community.id) });
});
