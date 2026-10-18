import { revalidatePath } from 'next/cache';
import { json, parseJson, parseSearchParams, route } from '@/lib/api';
import { getCurrentUser, requireUser } from '@/lib/auth-helpers';
import { createComment, listComments } from '@/lib/data/comments';
import { getPostById } from '@/lib/data/posts';
import { createCommentSchema } from '@/schemas/comment';
import { paginationQuerySchema } from '@/schemas/query';

interface IdContext {
  params: Promise<{ id: string }>;
}

export const GET = route<IdContext>(async (request, { params }) => {
  const query = parseSearchParams(request.url, paginationQuerySchema);
  const { id } = await params;
  return json(await listComments(id, query, await getCurrentUser()));
});

export const POST = route<IdContext>(async (request, { params }) => {
  const user = await requireUser();
  const input = await parseJson(request, createCommentSchema);
  const { id } = await params;

  const comment = await createComment(user, id, input);
  const post = await getPostById(id, user);
  if (post) {
    revalidatePath(`/blogs/${post.slug}`);
  }
  return json(comment, 201);
});
