import { revalidatePath } from 'next/cache';
import { json, parseJson, route } from '@/lib/api';
import { requireUser } from '@/lib/auth-helpers';
import { getUserDTOById, updateProfile } from '@/lib/data/users';
import { notFound } from '@/lib/errors';
import { updateProfileSchema } from '@/schemas/profile';

export const GET = route(async () => {
  const user = await requireUser();
  const me = await getUserDTOById(user.id);
  if (!me) {
    throw notFound('User not found');
  }
  return json(me);
});

export const PATCH = route(async (request) => {
  const user = await requireUser();
  const input = await parseJson(request, updateProfileSchema);
  const updated = await updateProfile(user, input);

  // The author's name and avatar appear on post summaries, so list and detail pages are refreshed too.
  revalidatePath(`/profile/${user.username}`);
  revalidatePath(`/profile/${updated.username}`);
  revalidatePath('/');
  revalidatePath('/blogs');
  revalidatePath('/blogs/[slug]', 'page');
  revalidatePath('/communities/[slug]', 'page');
  return json(updated);
});
