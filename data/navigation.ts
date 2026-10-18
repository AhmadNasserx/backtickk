import type { ComponentType } from "react";
import {
  BookmarkIcon,
  CompassIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
  type IconProps,
} from "@/components/ui/icons";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
  /** Only "/" needs this; without it the Explore link would be active on every page. */
  exact?: boolean;
}

// Icons are functions, so these items are only rendered on the server; client components get the rendered icon as children.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Explore", href: "/", icon: CompassIcon, exact: true },
  { label: "Communities", href: "/communities", icon: UsersIcon },
  { label: "Blogs", href: "/blogs", icon: FileTextIcon },
  { label: "Bookmarks", href: "/bookmarks", icon: BookmarkIcon },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];
