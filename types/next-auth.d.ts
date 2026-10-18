import type { UserRole } from './index';

declare module '@auth/core/types' {
  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    uid?: string;
    username?: string;
    role?: UserRole;
  }
}
