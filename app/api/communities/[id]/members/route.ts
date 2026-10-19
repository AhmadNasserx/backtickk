import { json, parseSearchParams, route } from '@/lib/api';
import { listCommunityMembers } from '@/lib/data/communities';
import { membersQuerySchema } from '@/schemas/query';

interface IdContext {
  params: Promise<{ id: string }>;
}

export const GET = route<IdContext>(async (request, { params }) => {
  const query = parseSearchParams(request.url, membersQuerySchema);
  const { id } = await params;
  return json(await listCommunityMembers(id, query));
});
