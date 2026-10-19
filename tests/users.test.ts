import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPublicProfileByUsername,
  getSessionUserById,
  getUserDTOById,
  updateProfile,
  upsertOAuthUser,
  type OAuthProfileInput,
} from '@/lib/data/users';
import { updateProfileSchema } from '@/schemas/profile';
import { User } from '@/models/user';
import { expectStatus } from './setup/assertions';
import { clearDb, makeUser, startDb, stopDb } from './setup/db';

beforeAll(async () => {
  await startDb();
});

afterAll(async () => {
  await stopDb();
});

beforeEach(async () => {
  await clearDb();
  // Keep promotion off unless a test opts in, whatever the developer's shell exports.
  vi.stubEnv('ADMIN_EMAILS', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

let accountCounter = 0;

/** A fresh OAuth identity; every call is a different provider account unless `providerAccountId` is given. */
function oauthProfile(overrides: Partial<OAuthProfileInput> = {}): OAuthProfileInput {
  accountCounter += 1;
  return {
    provider: 'github',
    providerAccountId: `gh-${accountCounter}-${Math.random().toString(36).slice(2, 8)}`,
    name: null,
    email: null,
    image: null,
    login: null,
    ...overrides,
  };
}

describe('first sign-in (upsertOAuthUser)', () => {
  it('creates a regular user named after the provider profile, with the GitHub login as username', async () => {
    const user = await upsertOAuthUser(
      oauthProfile({ name: 'Ada Lovelace', login: 'Ada-Codes', email: 'ada@example.test', image: 'https://img.example/ada.png' }),
    );

    expect(user).toMatchObject({ name: 'Ada Lovelace', username: 'ada-codes', role: 'user' });
    expect(user.image).toBe('https://img.example/ada.png');
  });

  it('falls back to the email local part for the username when there is no login', async () => {
    const user = await upsertOAuthUser(oauthProfile({ provider: 'google', email: 'Jane.Doe@Example.test', name: null }));

    expect(user.username).toBe('jane-doe');
    expect(user.name).toBe('jane.doe');
  });

  it('turns an arbitrary display name into a valid username when nothing else is available', async () => {
    const user = await upsertOAuthUser(oauthProfile({ provider: 'google', name: 'Zoë  O\'Neil' }));

    expect(user.username).toMatch(/^[a-z0-9_-]{3,30}$/);
    expect(user.username).toBe('zoe-o-neil');
  });

  it('uses "user" as the username base when the candidate is shorter than 3 characters', async () => {
    const user = await upsertOAuthUser(oauthProfile({ login: 'ab' }));

    expect(user.username).toBe('user');
  });

  it('gives a new user the same identity fields the stored record has', async () => {
    const user = await upsertOAuthUser(oauthProfile({ login: 'stored-check', name: 'Stored Check', email: 'stored@example.test' }));

    const stored = await User.findById(user.id).lean();
    expect(stored).toMatchObject({ provider: 'github', username: 'stored-check', role: 'user', email: 'stored@example.test' });
  });
});

describe('returning sign-ins', () => {
  it('resolves the same provider account to the same user id and keeps the username stable', async () => {
    const profile = oauthProfile({ login: 'stable-name', name: 'Stable Name' });
    const first = await upsertOAuthUser(profile);

    const second = await upsertOAuthUser({ ...profile, login: 'renamed-on-github' });

    expect(second.id).toBe(first.id);
    expect(second.username).toBe('stable-name');
    expect(await User.countDocuments({ providerAccountId: profile.providerAccountId })).toBe(1);
  });

  it('keeps the display name set at creation, but refreshes image and email from the provider', async () => {
    const profile = oauthProfile({ login: 'refresh-me', name: 'Original Name', email: 'old@example.test', image: 'https://img/1.png' });
    const first = await upsertOAuthUser(profile);

    const second = await upsertOAuthUser({ ...profile, name: 'Provider Changed Name', email: 'NEW@example.test', image: 'https://img/2.png' });

    expect(second.name).toBe('Original Name');
    expect(second.image).toBe('https://img/2.png');
    const stored = await User.findById(first.id).lean();
    expect(stored?.email).toBe('new@example.test');
  });

  it('keeps the existing email when the provider stops sending one', async () => {
    const profile = oauthProfile({ login: 'keeps-email', email: 'kept@example.test' });
    await upsertOAuthUser(profile);

    await upsertOAuthUser({ ...profile, email: null });

    expect((await User.findOne({ providerAccountId: profile.providerAccountId }).lean())?.email).toBe('kept@example.test');
  });

  it('treats the same account id under a different provider as a different user', async () => {
    const github = await upsertOAuthUser(oauthProfile({ providerAccountId: 'shared-id', login: 'gh-person' }));

    const google = await upsertOAuthUser(oauthProfile({ provider: 'google', providerAccountId: 'shared-id', name: 'Google Person' }));

    expect(google.id).not.toBe(github.id);
  });

  it('creates exactly one user when two first sign-ins for the same account race', async () => {
    const profile = oauthProfile({ login: 'racing-ada' });

    const [a, b] = await Promise.all([upsertOAuthUser(profile), upsertOAuthUser(profile)]);

    expect(a.id).toBe(b.id);
    expect(await User.countDocuments({ providerAccountId: profile.providerAccountId })).toBe(1);
  });
});

describe('username generation', () => {
  it('suffixes a taken login with -2, -3, ... so every user gets a unique username', async () => {
    const usernames = [];
    for (let index = 0; index < 3; index += 1) {
      usernames.push((await upsertOAuthUser(oauthProfile({ login: 'octocat' }))).username);
    }

    expect(usernames).toEqual(['octocat', 'octocat-2', 'octocat-3']);
  });

  it('never hands out a reserved route name, suffixing it instead', async () => {
    const user = await upsertOAuthUser(oauthProfile({ login: 'admin' }));

    expect(user.username).toBe('admin-2');
  });

  it('gives two simultaneous sign-ins with the same login distinct usernames', async () => {
    const [first, second] = await Promise.all([
      upsertOAuthUser(oauthProfile({ login: 'racer' })),
      upsertOAuthUser(oauthProfile({ login: 'racer' })),
    ]);

    expect(new Set([first.username, second.username]).size).toBe(2);
    expect([first.username, second.username].sort()).toEqual(['racer', 'racer-2']);
  });

  it('keeps a generated username within the 30-character limit even with a long login', async () => {
    const login = 'a'.repeat(40);
    await upsertOAuthUser(oauthProfile({ login }));

    const second = await upsertOAuthUser(oauthProfile({ login }));

    expect(second.username.length).toBeLessThanOrEqual(30);
    expect(second.username.endsWith('-2')).toBe(true);
  });
});

describe('ADMIN_EMAILS promotion', () => {
  it('makes a user whose email is listed an admin, ignoring case and spacing in the list', async () => {
    vi.stubEnv('ADMIN_EMAILS', ' Boss@Example.test , second@example.test ');

    const user = await upsertOAuthUser(oauthProfile({ login: 'the-boss', email: 'BOSS@example.test' }));

    expect(user.role).toBe('admin');
  });

  it('leaves users whose email is not listed as regular users', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'boss@example.test');

    const user = await upsertOAuthUser(oauthProfile({ login: 'regular', email: 'someone@example.test' }));

    expect(user.role).toBe('user');
  });

  it('promotes an existing user on their next sign-in once they are listed', async () => {
    const profile = oauthProfile({ login: 'late-promotion', email: 'late@example.test' });
    expect((await upsertOAuthUser(profile)).role).toBe('user');

    vi.stubEnv('ADMIN_EMAILS', 'late@example.test');
    const next = await upsertOAuthUser(profile);

    expect(next.role).toBe('admin');
  });

  it('never demotes a user, even when their email is no longer in the list', async () => {
    const profile = oauthProfile({ login: 'hand-promoted', email: 'hand@example.test' });
    await upsertOAuthUser(profile);
    await User.updateOne({ providerAccountId: profile.providerAccountId }, { role: 'admin' });
    vi.stubEnv('ADMIN_EMAILS', 'someone-else@example.test');

    const next = await upsertOAuthUser(profile);

    expect(next.role).toBe('admin');
  });

  it('does not promote anyone when ADMIN_EMAILS is unset', async () => {
    vi.stubEnv('ADMIN_EMAILS', '');

    const user = await upsertOAuthUser(oauthProfile({ login: 'nobody-special', email: 'nobody@example.test' }));

    expect(user.role).toBe('user');
  });
});

describe('profile updates (updateProfile)', () => {
  it('returns 409 with a field error when another user already has the username', async () => {
    await makeUser({ username: 'alice' });
    const bob = await makeUser({ username: 'bobby' });
    const input = updateProfileSchema.parse({ name: 'Bob', username: 'alice' });

    const error = await expectStatus(updateProfile(bob, input), 409);

    expect(error.details).toEqual({ fieldErrors: { username: ['Username is already taken'] } });
    expect((await User.findById(bob.id).lean())?.username).toBe('bobby');
  });

  it('lets a user save their own current username without a conflict', async () => {
    const alice = await makeUser({ username: 'alice' });

    const updated = await updateProfile(alice, updateProfileSchema.parse({ name: 'Alice Renamed', username: 'alice', bio: 'Hi' }));

    expect(updated).toMatchObject({ name: 'Alice Renamed', username: 'alice', bio: 'Hi' });
  });

  it('lets a user move to a free username', async () => {
    const alice = await makeUser({ username: 'alice' });

    const updated = await updateProfile(alice, updateProfileSchema.parse({ name: 'Alice', username: 'alice-new' }));

    expect(updated.username).toBe('alice-new');
    expect(await getSessionUserById(alice.id)).toMatchObject({ username: 'alice-new' });
  });

  it('lets only one of two simultaneous claims on the same username succeed', async () => {
    const first = await makeUser();
    const second = await makeUser();
    const input = updateProfileSchema.parse({ name: 'Racer', username: 'contested-name' });

    const results = await Promise.allSettled([updateProfile(first, input), updateProfile(second, input)]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    expect(rejected?.reason).toMatchObject({ status: 409 });
  });
});

describe('what each user may see', () => {
  it('shows a public profile without the email address', async () => {
    const user = await makeUser({ username: 'public-ada', name: 'Public Ada', email: 'secret.address@example.test', bio: 'Hello', skills: ['react'] });

    const profile = await getPublicProfileByUsername('public-ada');

    expect(profile).toEqual({
      id: user.id,
      name: 'Public Ada',
      username: 'public-ada',
      image: null,
      bio: 'Hello',
      skills: ['react'],
      createdAt: expect.any(String),
    });
    expect(Object.keys(profile ?? {})).not.toContain('email');
    expect(JSON.stringify(profile)).not.toContain('secret.address@example.test');
  });

  it('never exposes the email through the public profile, even when the username is looked up in another case', async () => {
    await makeUser({ username: 'mixed-case', email: 'hidden@example.test' });

    const profile = await getPublicProfileByUsername('MIXED-Case');

    expect(profile?.username).toBe('mixed-case');
    expect(JSON.stringify(profile)).not.toContain('hidden@example.test');
  });

  it('returns null for a malformed or unknown username', async () => {
    expect(await getPublicProfileByUsername('has space')).toBeNull();
    expect(await getPublicProfileByUsername('no-such-user')).toBeNull();
  });

  it('includes the email only in the signed-in user\'s own record', async () => {
    const user = await makeUser({ username: 'self-view', email: 'me@example.test' });

    const own = await getUserDTOById(user.id);

    expect(own?.email).toBe('me@example.test');
    expect(own?.role).toBe('user');
  });

  it('keeps the session view to id, username, name, image and role', async () => {
    const user = await makeUser({ email: 'session@example.test' });

    const session = await getSessionUserById(user.id);

    expect(Object.keys(session ?? {}).sort()).toEqual(['id', 'image', 'name', 'role', 'username']);
  });
});
