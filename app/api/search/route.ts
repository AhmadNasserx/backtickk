import { json, parseSearchParams, route } from '@/lib/api';
import { searchAll } from '@/lib/data/search';
import { searchQuerySchema } from '@/schemas/query';

export const GET = route(async (request) => {
  const query = parseSearchParams(request.url, searchQuerySchema);
  return json(await searchAll(query.q, { page: query.page, limit: query.limit }));
});
