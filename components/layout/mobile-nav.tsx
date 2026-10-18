"use client";
// Client boundary: the drawer toggle holds open/closed state and listens for clicks and Escape.

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";

const PANEL_ID = "mobile-nav-panel";

export function MobileNav({ children }: { children: ReactNode }) {
  // Storing the path the drawer was opened on closes it automatically after any navigation.
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  return (
    <div
      className="lg:hidden"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpenPath(null);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpenPath(open ? null : pathname)}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
      </button>

      <div
        id={PANEL_ID}
        className={cn(
          "fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto border-t border-line bg-bg px-3 py-4",
          open ? "block" : "hidden",
        )}
        onClick={(event) => {
          // Clicking a link to the current page does not change the pathname, so close here too.
          if ((event.target as HTMLElement).closest("a")) setOpenPath(null);
        }}
      >
        {children}
      </div>
    </div>
  );
}
