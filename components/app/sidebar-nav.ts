import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Compass,
  Globe2,
  Heart,
  Home,
  Sparkles,
  Sun,
} from "lucide-react";

export type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Treat sub-routes (e.g. /reading/[id]) as active under this item. */
  matchPrefix?: string;
};

/**
 * Primary navigation shown in the desktop sidebar. Profile lives in the
 * footer dropdown, not here, so the rail stays focused on workflow destinations.
 */
export const PRIMARY_NAV: SidebarItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/chart", label: "My Chart", icon: Compass },
  { href: "/couples", label: "Couples", icon: Heart },
  { href: "/mundane", label: "World Charts", icon: Globe2, matchPrefix: "/mundane" },
  { href: "/reading/new?type=weather", label: "Sky Weather", icon: Sun, matchPrefix: "/reading/new" },
  { href: "/readings", label: "Readings", icon: Sparkles },
  { href: "/learn", label: "Learn", icon: BookOpen, matchPrefix: "/learn" },
];

export function isItemActive(item: SidebarItem, pathname: string): boolean {
  const base = item.href.split("?")[0];
  if (pathname === base) return true;
  if (item.matchPrefix && pathname.startsWith(item.matchPrefix)) return true;
  return false;
}
