import { revalidatePath } from 'next/cache';
import { json, parseJson, route } from '@/lib/api';
import { notFound } from '@/lib/errors';
import { getCurrentUser, requireUser } from '@/lib/auth-helpers';
import { deletePost, getPostById, updatePost } from '@/lib/data/posts';
import { updatePostSchema } from '@/schemas/post';
import type { PostDetailDTO } from '@/types';

interface IdContext {
  params: Promise<{ id: string }>;
}

function revalidatePost(post: PostDetailDTO): void {
  revalidatePath('/');
  revalidatePath('/blogs');
  revalidatePath(`/blogs/${post.slug}`);
  revalidatePath(`/communities/${post.community.slug}`);
  revalidatePath(`/profile/${post.author.username}`);
}

export const GET = route<IdContext>(async (_request, { params }) => {
  const { id } = await params;
  const post = await getPostById(id, await getCurrentUser());
  if (!post) {
    throw notFound('Post not found');
  }
  return json(post);
});

export const PATCH = route<IdContext>(async (request, { params }) => {
  const user = await requireUser();
  const input = await parseJson(request, updatePostSchema);
  const { id } = await params;

  // Read before writing so a moved post also refreshes its old community. A null here is
  // left to updatePost, which then answers with the correct 403 or 404.
  const previous = await getPostById(id, user);
  const post = await updatePost(user, id, input);

  revalidatePost(post);
  if (previous && previous.community.slug !== post.community.slug) {
    revalidatePath(`/communities/${previous.community.slug}`);
  }
  return json(post);
});

export const DELETE = route<IdContext>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;

  // The slugs are needed for revalidation, so read the post before it is removed.
  const post = await getPostById(id, user);
  await deletePost(user, id);

  if (post) {
    revalidatePost(post);
  }
  return json({ ok: true });
});
