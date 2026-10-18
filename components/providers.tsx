"use client";
// Client boundary: SessionProvider shares the auth session via React context, which Server Components cannot use.

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
