import { vi } from 'vitest';

/*
 * The data layer receives the viewer as an explicit SessionUser, so tests never need a real Auth.js session.
 * Loading the real `auth.ts` under Node ESM fails (next-auth imports `next/server` without an extension),
 * so `@/auth` is replaced for every test file.
 */
vi.mock('@/auth', () => ({
  auth: vi.fn(async () => null),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
