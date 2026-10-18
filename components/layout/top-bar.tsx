import Link from "next/link";
import { PrimaryNav } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { GlobalSearch } from "@/components/layout/global-search";
import { UserMenu } from "@/components/layout/user-menu";

export function TopBar() {
  return (
    // No backdrop-filter here: it would turn this header into the containing block of the fixed mobile drawer.
    <header className="sticky top-0 z-30 h-14 border-b border-line bg-bg">
      <div className="flex h-full items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <MobileNav>
          <PrimaryNav />
        </MobileNav>

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span
            aria-hidden="true"
            className="hidden size-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white sm:flex"
          >
            DC
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-fg">DevCommunity</span>
            <span className="hidden text-xs text-subtle md:block">
              Learn and share with developers
            </span>
          </span>
        </Link>

        <GlobalSearch className="ml-auto w-full max-w-md" />

        <UserMenu />
      </div>
    </header>
  );
}
