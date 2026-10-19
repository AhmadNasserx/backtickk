import Link from "next/link";
import { NAV_ITEMS, WRITE_HREF } from "@/data/navigation";
import { NavLink } from "@/components/layout/nav-link";
import { CommandSearch } from "@/components/layout/command-search";
import { MobileSearch } from "@/components/layout/mobile-search";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonClasses } from "@/components/ui/button";
import { PenLineIcon } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/logo";

const NAV_LINK =
  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

// Server Component: the wordmark and link list are static; search and the account menu are small client islands.
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md supports-backdrop-filter:bg-bg/65">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Backtickk home"
          className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  exact={item.exact}
                  className={NAV_LINK}
                  activeClassName="text-fg shadow-[inset_0_-2px_0_0_var(--color-accent)]"
                  inactiveClassName="text-muted hover:text-fg"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <CommandSearch className="w-full max-w-md" />
        </div>

        <MobileSearch />

        <div className="hidden lg:block">
          <Link href={WRITE_HREF} className={buttonClasses("primary", "sm", "gap-1.5")}>
            <PenLineIcon aria-hidden="true" className="size-4" />
            Write
          </Link>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
