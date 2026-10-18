import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { isOAuthProvider, upsertOAuthUser } from '@/lib/data/users';

/*
 * Full Auth.js setup (Node runtime only). Database access happens here, on first
 * sign-in, so the session cookie itself carries only uid/username/role.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // `account` is only present on the sign-in request itself.
      if (!account || !user || !isOAuthProvider(account.provider)) {
        return token;
      }

      const dbUser = await upsertOAuthUser({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        name: user.name ?? null,
        email: user.email ?? null,
        image: user.image ?? null,
        login: typeof profile?.login === 'string' ? profile.login : null,
      });

      token.uid = dbUser.id;
      token.username = dbUser.username;
      token.role = dbUser.role;
      return token;
    },
    session({ session, token }) {
      // An empty id means the token predates sign-in data; getCurrentUser treats it as signed out.
      session.user = {
        ...session.user,
        id: token.uid ?? '',
        username: token.username ?? '',
        role: token.role ?? 'user',
      };
      return session;
    },
  },
});
