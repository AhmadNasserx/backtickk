import type { ComponentType, SVGProps } from "react";
import {
  BookmarkIcon,
  CompassIcon,
  FileTextIcon,
  PenLineIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/icons";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
  /** Only "/" needs this; without it the Explore link would be active on every page. */
  exact?: boolean;
  /** Mobile only: rendered as the centre accent button. */
  accent?: boolean;
}

export const WRITE_HREF = "/create";

// Icons are functions, so these arrays are only rendered on the server; client components get the rendered icon as children.

/** Primary links in the desktop top bar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Explore", href: "/", icon: CompassIcon, exact: true },
  { label: "Communities", href: "/communities", icon: UsersIcon },
  { label: "Blogs", href: "/blogs", icon: FileTextIcon },
];

/** Fixed bottom tab bar on small screens: five tabs with Write in the centre. */
export const MOBILE_TABS: readonly NavItem[] = [
  { label: "Explore", href: "/", icon: CompassIcon, exact: true },
  { label: "Communities", href: "/communities", icon: UsersIcon },
  { label: "Write", href: WRITE_HREF, icon: PenLineIcon, accent: true },
  { label: "Saved", href: "/bookmarks", icon: BookmarkIcon },
  { label: "Me", href: "/dashboard", icon: UserIcon },
];

/** Search results live on the blog list, so the query travels in the URL. */
export function blogSearchHref(term: string): string {
  const value = term.trim();
  return value ? `/blogs?search=${encodeURIComponent(value)}` : "/blogs";
}
