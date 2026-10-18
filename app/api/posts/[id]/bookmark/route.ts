import { json, route } from '@/lib/api';
import { requireUser } from '@/lib/auth-helpers';
import { addBookmark, isBookmarked, removeBookmark } from '@/lib/data/bookmarks';
import type { BookmarkStatusDTO } from '@/types';

interface IdContext {
  params: Promise<{ id: string }>;
}

export const GET = route<IdContext>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const status: BookmarkStatusDTO = { bookmarked: await isBookmarked(user.id, id) };
  return json(status);
});

// Bookmarks are private to the user and are not rendered on any cached public page, so no revalidation.
export const PUT = route<IdContext>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return json(await addBookmark(user, id));
});

export const DELETE = route<IdContext>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return json(await removeBookmark(user, id));
});
