import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as communitiesModule from '@/lib/data/communities';
import {
  getCommunityBySlug,
  joinCommunity,
  leaveCommunity,
  listCommunities,
} from '@/lib/data/communities';
import { Community } from '@/models/community';
import { Membership } from '@/models/membership';
import type { MemberDTO, PaginatedResult } from '@/types';
import { expectStatus } from './setup/assertions';
import { clearDb, makeCommunity, makeMembership, makeUser, newObjectId, startDb, stopDb } from './setup/db';

beforeAll(async () => {
  await startDb();
});

afterAll(async () => {
  await stopDb();
});

beforeEach(async () => {
  await clearDb();
});

async function storedMemberCount(communityId: string): Promise<number> {
  return (await Community.findById(communityId).lean())?.memberCount ?? -1;
}

async function storedMembershipCount(communityId: string): Promise<number> {
  return Membership.countDocuments({ community: communityId });
}

describe('joining a community', () => {
  it('adds the user and raises the member count by one', async () => {
    const user = await makeUser();
    const community = await makeCommunity();

    const state = await joinCommunity(user, community.id);

    expect(state).toEqual({ member: true, memberCount: 1 });
  });

  it('is idempotent: a second join does not raise the count again', async () => {
    const user = await makeUser();
    const community = await makeCommunity();
    await joinCommunity(user, community.id);

    const second = await joinCommunity(user, community.id);

    expect(second).toEqual({ member: true, memberCount: 1 });
    expect(await storedMemberCount(community.id)).toBe(1);
    expect(await storedMembershipCount(community.id)).toBe(1);
  });

  it('counts one member when the same user joins concurrently five times', async () => {
    const user = await makeUser();
    const community = await makeCommunity();

    await Promise.all(Array.from({ length: 5 }, () => joinCommunity(user, community.id)));

    expect(await storedMemberCount(community.id)).toBe(1);
    expect(await storedMembershipCount(community.id)).toBe(1);
  });

  it('counts every distinct user who joins concurrently', async () => {
    const users = await Promise.all(Array.from({ length: 5 }, () => makeUser()));
    const community = await makeCommunity();

    await Promise.all(users.map((user) => joinCommunity(user, community.id)));

    expect(await storedMemberCount(community.id)).toBe(5);
  });

  it('returns 404 for a community that does not exist', async () => {
    const user = await makeUser();

    await expectStatus(joinCommunity(user, newObjectId()), 404);
  });
});

describe('leaving a community', () => {
  it('removes the membership and lowers the count by one', async () => {
    const user = await makeUser();
    const community = await makeCommunity();
    await joinCommunity(user, community.id);

    const state = await leaveCommunity(user, community.id);

    expect(state).toEqual({ member: false, memberCount: 0 });
    expect(await storedMembershipCount(community.id)).toBe(0);
  });

  it('is idempotent: leaving twice lowers the count only once', async () => {
    const user = await makeUser();
    const other = await makeUser();
    const community = await makeCommunity();
    await joinCommunity(user, community.id);
    await joinCommunity(other, community.id);

    await leaveCommunity(user, community.id);
    const second = await leaveCommunity(user, community.id);

    expect(second).toEqual({ member: false, memberCount: 1 });
    expect(await storedMemberCount(community.id)).toBe(1);
  });

  it('never drives the count below zero when leaving without a membership', async () => {
    const stranger = await makeUser();
    const community = await makeCommunity();

    const state = await leaveCommunity(stranger, community.id);

    expect(state).toEqual({ member: false, memberCount: 0 });
    expect(await storedMemberCount(community.id)).toBe(0);
  });

  it('lowers the count once when the same member leaves concurrently five times', async () => {
    const user = await makeUser();
    const community = await makeCommunity();
    await joinCommunity(user, community.id);

    await Promise.all(Array.from({ length: 5 }, () => leaveCommunity(user, community.id)));

    expect(await storedMemberCount(community.id)).toBe(0);
    expect(await storedMembershipCount(community.id)).toBe(0);
  });

  it('returns 404 for a community that does not exist', async () => {
    const user = await makeUser();

    await expectStatus(leaveCommunity(user, newObjectId()), 404);
  });
});

describe('memberCount consistency', () => {
  it('always equals the number of membership rows after a mixed sequence of joins and leaves', async () => {
    const [ada, grace, linus, margaret] = await Promise.all([makeUser(), makeUser(), makeUser(), makeUser()]);
    const community = await makeCommunity();

    await joinCommunity(ada, community.id);
    await joinCommunity(grace, community.id);
    await joinCommunity(ada, community.id);
    await joinCommunity(linus, community.id);
    await leaveCommunity(grace, community.id);
    await leaveCommunity(grace, community.id);
    await leaveCommunity(margaret, community.id);
    await joinCommunity(grace, community.id);
    await leaveCommunity(ada, community.id);
    await joinCommunity(margaret, community.id);

    const members = await storedMembershipCount(community.id);
    expect(members).toBe(3);
    expect(await storedMemberCount(community.id)).toBe(members);
  });

  it('keeps the count in step with memberships created directly by fixtures', async () => {
    const [first, second] = await Promise.all([makeUser(), makeUser()]);
    const community = await makeCommunity();
    await makeMembership(first.id, community.id);
    await makeMembership(second.id, community.id);

    await leaveCommunity(first, community.id);

    expect(await storedMemberCount(community.id)).toBe(await storedMembershipCount(community.id));
  });
});

describe('listing communities', () => {
  async function seedDirectory() {
    const rust = await makeCommunity({ name: 'Rust Friends', description: 'Systems programming chat', topics: ['rust'] });
    const go = await makeCommunity({ name: 'Learn Go', description: 'Beginner friendly', topics: ['go'] });
    const cpp = await makeCommunity({ name: 'C++ Club', description: 'Modern C++ and templates', topics: ['c++'] });
    return { rust, go, cpp };
  }

  it('matches the search term against name or description, case-insensitively', async () => {
    const { rust } = await seedDirectory();

    const byName = await listCommunities({ search: 'rUsT' });
    const byDescription = await listCommunities({ search: 'systems' });

    expect(byName.items.map((item) => item.id)).toEqual([rust.id]);
    expect(byDescription.items.map((item) => item.id)).toEqual([rust.id]);
  });

  it('filters by topic, ignoring the case of the topic', async () => {
    const { go } = await seedDirectory();

    const result = await listCommunities({ topic: 'GO' });

    expect(result.items.map((item) => item.id)).toEqual([go.id]);
  });

  it('treats regex characters in the search as literal text', async () => {
    const { cpp } = await seedDirectory();

    const cppResult = await listCommunities({ search: 'c++' });
    const wildcard = await listCommunities({ search: '.*' });

    expect(cppResult.items.map((item) => item.id)).toEqual([cpp.id]);
    expect(wildcard.total).toBe(0);
  });

  it('orders by member count, most members first', async () => {
    const quiet = await makeCommunity({ name: 'Quiet room' });
    const busy = await makeCommunity({ name: 'Busy room' });
    const [a, b] = await Promise.all([makeUser(), makeUser()]);
    await makeMembership(a.id, busy.id);
    await makeMembership(b.id, busy.id);
    await makeMembership(a.id, quiet.id);

    const result = await listCommunities();

    expect(result.items.map((item) => item.id)).toEqual([busy.id, quiet.id]);
  });

  it('paginates with total and totalPages, and returns an empty page past the end', async () => {
    for (let index = 0; index < 13; index += 1) {
      await makeCommunity({ name: `Community ${String(index).padStart(2, '0')}` });
    }

    const first = await listCommunities({ page: 1 });
    const last = await listCommunities({ page: 2 });
    const past = await listCommunities({ page: 9 });
    const fiveAtATime = await listCommunities({ page: 3, limit: 5 });

    expect(first.items).toHaveLength(12);
    expect(first).toMatchObject({ page: 1, limit: 12, total: 13, totalPages: 2 });
    expect(last.items).toHaveLength(1);
    expect(past.items).toEqual([]);
    expect(past.total).toBe(13);
    expect(fiveAtATime).toMatchObject({ limit: 5, totalPages: 3 });
    expect(fiveAtATime.items).toHaveLength(3);
  });
});

describe('looking up a community by slug', () => {
  it('matches the slug regardless of case', async () => {
    const community = await makeCommunity({ slug: 'design-systems' });

    expect((await getCommunityBySlug('Design-Systems'))?.id).toBe(community.id);
  });

  it('returns null for an unknown slug', async () => {
    expect(await getCommunityBySlug('no-such-community')).toBeNull();
  });
});

/*
 * listCommunityMembers is being added alongside this suite. The export is read dynamically so this file
 * still typechecks and runs before it lands; the block is skipped until it exists.
 */
type ListCommunityMembers = (
  communityId: string,
  query: { page?: number; limit?: number },
) => Promise<PaginatedResult<MemberDTO>>;

const listCommunityMembers = (communitiesModule as unknown as Record<string, unknown>).listCommunityMembers as
  | ListCommunityMembers
  | undefined;

describe.skipIf(typeof listCommunityMembers !== 'function')('listing community members', () => {
  it('paginates the member list without skipping or repeating anyone', async () => {
    const community = await makeCommunity();
    const members = await Promise.all(Array.from({ length: 5 }, () => makeUser()));
    for (const member of members) {
      await makeMembership(member.id, community.id);
    }

    const first = await listCommunityMembers!(community.id, { page: 1, limit: 2 });
    const second = await listCommunityMembers!(community.id, { page: 2, limit: 2 });
    const third = await listCommunityMembers!(community.id, { page: 3, limit: 2 });

    expect(first).toMatchObject({ total: 5, totalPages: 3, page: 1, limit: 2 });
    expect(third.items).toHaveLength(1);
    const seen = [...first.items, ...second.items, ...third.items].map((item) => item.id);
    expect(new Set(seen).size).toBe(5);
    expect(seen.sort()).toEqual(members.map((member) => member.id).sort());
  });

  it('never returns an email address, under any key', async () => {
    const community = await makeCommunity();
    const member = await makeUser({ email: 'private.person@example.test' });
    await makeMembership(member.id, community.id);

    const page = await listCommunityMembers!(community.id, { page: 1, limit: 10 });

    expect(page.items).toHaveLength(1);
    for (const item of page.items) {
      expect(Object.keys(item)).not.toContain('email');
    }
    expect(JSON.stringify(page)).not.toContain('private.person@example.test');
  });
});
