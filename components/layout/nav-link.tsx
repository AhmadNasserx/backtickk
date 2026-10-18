"use client";
// Client boundary: usePathname() is needed to set aria-current and pick the active styling for the current route.

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavLinkProps = {
  href: string;
  /** Match only the exact path (used for "/" so it is not active everywhere). */
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  children: ReactNode;
};

export function NavLink({
  href,
  exact = false,
  className,
  activeClassName,
  inactiveClassName,
  children,
}: NavLinkProps) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(className, active ? activeClassName : inactiveClassName)}
    >
      {children}
    </Link>
  );
}
