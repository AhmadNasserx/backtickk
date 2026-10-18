import { listCommunities } from '@/lib/data/communities';
import { listPosts } from '@/lib/data/posts';
import type { SearchResultDTO } from '@/types';

const COMMUNITY_RESULT_LIMIT = 6;

/** Published posts (paginated) plus a short list of matching communities. */
export async function searchAll(q: string, options: { page?: number; limit?: number } = {}): Promise<SearchResultDTO> {
  const [posts, communities] = await Promise.all([
    listPosts({ search: q, page: options.page, limit: options.limit, sort: 'newest' }),
    listCommunities({ search: q, page: 1, limit: COMMUNITY_RESULT_LIMIT }),
  ]);
  return { posts, communities: communities.items };
}
