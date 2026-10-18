import { revalidatePath } from 'next/cache';
import { json, parseJson, parseSearchParams, route } from '@/lib/api';
import { getCurrentUser, requireUser } from '@/lib/auth-helpers';
import { createPost, listPosts } from '@/lib/data/posts';
import { createPostSchema } from '@/schemas/post';
import { postsQuerySchema } from '@/schemas/query';

export const GET = route(async (request) => {
  const query = parseSearchParams(request.url, postsQuerySchema);
  return json(await listPosts(query, await getCurrentUser()));
});

export const POST = route(async (request) => {
  const user = await requireUser();
  const input = await parseJson(request, createPostSchema);
  const post = await createPost(user, input);

  if (post.status === 'published') {
    revalidatePath('/');
    revalidatePath('/blogs');
    revalidatePath(`/blogs/${post.slug}`);
    revalidatePath(`/communities/${post.community.slug}`);
    revalidatePath(`/profile/${post.author.username}`);
  }
  return json(post, 201);
});
