import { json, parseSearchParams, route } from '@/lib/api';
import { listCommunities } from '@/lib/data/communities';
import { communitiesQuerySchema } from '@/schemas/query';

export const GET = route(async (request) => {
  const query = parseSearchParams(request.url, communitiesQuerySchema);
  return json(await listCommunities(query));
});
