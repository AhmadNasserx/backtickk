"use client";
// Client boundary: usePathname() is needed to mark the active link.

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavLinkProps = {
  href: string;
  /** Match only the exact path (used for "/" so it is not active everywhere). */
  exact?: boolean;
  className?: string;
  children: ReactNode;
};

export function NavLink({ href, exact = false, className, children }: NavLinkProps) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        active
          ? "bg-surface-2 text-fg shadow-[inset_2px_0_0_0_var(--color-brand)]"
          : "text-muted hover:bg-surface-2 hover:text-fg",
        className,
      )}
    >
      {children}
    </Link>
  );
}
