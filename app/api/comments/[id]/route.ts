import { revalidatePath } from 'next/cache';
import { json, route } from '@/lib/api';
import { requireUser } from '@/lib/auth-helpers';
import { deleteComment } from '@/lib/data/comments';

interface IdContext {
  params: Promise<{ id: string }>;
}

export const DELETE = route<IdContext>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteComment(user, id);

  // The comment does not expose its post, so every cached post page is refreshed on the next visit.
  revalidatePath('/blogs/[slug]', 'page');
  return json({ ok: true });
});
