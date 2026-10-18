import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

/*
 * Edge/proxy-safe configuration shared by auth.ts and proxy.ts.
 * Must not import database code: proxy.ts runs before any server module loads.
 * Credentials come from AUTH_GITHUB_ID/SECRET and AUTH_GOOGLE_ID/SECRET (read automatically).
 */
export const authConfig = {
  providers: [GitHub, Google],
  pages: { signIn: '/signin' },
  session: { strategy: 'jwt' },
  trustHost: true,
} satisfies NextAuthConfig;
