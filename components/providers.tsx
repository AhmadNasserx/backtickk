"use client";
// Client boundary: SessionProvider shares the auth session via React context, which Server Components cannot use.
// Spotlight is mounted here too: it renders nothing and only adds one document-level pointer listener.

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { Spotlight } from "@/components/motion/spotlight";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Spotlight />
    </SessionProvider>
  );
}
