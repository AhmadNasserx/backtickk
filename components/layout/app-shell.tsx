import type { ReactNode } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

// Server Component: no request-time data, so the shell adds nothing to a page's rendering mode.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-60">
        <TopBar />

        <main id="main" className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="border-t border-line px-4 py-6 text-sm text-subtle sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p>DevCommunity · Developer communities and blogs</p>
            <Link href="/about" className="rounded hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              About and guidelines
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
