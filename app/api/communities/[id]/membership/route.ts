import { json, route } from '@/lib/api';
import { requireUser } from '@/lib/auth-helpers';
import { getMembershipStatus } from '@/lib/data/communities';

interface IdContext {
  params: Promise<{ id: string }>;
}

export const GET = route<IdContext>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return json(await getMembershipStatus(user.id, id));
});
