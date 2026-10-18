import { NAV_ITEMS } from "@/data/navigation";
import { NavLink } from "@/components/layout/nav-link";

// Server Component: the link list is static, and only the active-state logic lives in NavLink.
export function PrimaryNav() {
  return (
    <nav aria-label="Primary">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <NavLink href={item.href} exact={item.exact}>
                <Icon className="size-5 shrink-0" />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col overflow-y-auto border-r border-line bg-surface lg:flex">
      <div className="p-3 pt-4">
        <PrimaryNav />
      </div>
    </aside>
  );
}
