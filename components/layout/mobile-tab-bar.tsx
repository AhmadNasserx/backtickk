import { MOBILE_TABS } from "@/data/navigation";
import { NavLink } from "@/components/layout/nav-link";

const TAB =
  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-xl px-1 pb-1.5 font-mono text-[10px] font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

// Server Component: the tab list is static, and NavLink alone tracks which tab is active.
export function MobileTabBar() {
  return (
    <nav
      aria-label="Mobile"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/85 backdrop-blur-md supports-backdrop-filter:bg-bg/70 lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch px-2 pt-1">
        {MOBILE_TABS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex min-w-0 flex-1">
              <NavLink
                href={item.href}
                exact={item.exact}
                className={TAB}
                activeClassName="text-accent"
                inactiveClassName="text-muted hover:text-fg"
              >
                {item.accent ? (
                  <span className="-mt-5 grid size-12 place-items-center rounded-full bg-accent text-accent-fg shadow-[0_0_0_4px_var(--color-bg)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                ) : (
                  <Icon aria-hidden="true" className="size-5" />
                )}
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
