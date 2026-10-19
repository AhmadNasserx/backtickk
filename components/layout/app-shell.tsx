import type { ReactNode } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Wordmark } from "@/components/ui/logo";

// Server Component: no request-time data (the session is read in the client UserMenu), so the shell adds nothing to a page's rendering mode.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        Skip to content
      </a>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <TopBar />

        <main
          id="main"
          className="mx-auto w-full max-w-6xl min-w-0 flex-1 overflow-x-clip px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pt-10 lg:pb-16"
        >
          {children}
        </main>

        {/* Bottom padding clears the fixed mobile tab bar; desktop has no bar. */}
        <footer className="border-t border-line pb-20 lg:pb-0">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 font-mono text-xs text-subtle sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Wordmark />
              <p>© {new Date().getFullYear()} Backtick</p>
            </div>
            <Link
              href="/about"
              className="rounded text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              About &amp; guidelines
            </Link>
          </div>
        </footer>
      </div>

      <MobileTabBar />
    </>
  );
}
