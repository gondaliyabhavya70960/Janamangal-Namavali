import {
  BarChart3,
  Heart,
  History,
  LayoutDashboard,
  Library,
  ListMusic,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: Library },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/history", label: "History", icon: History },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Primary destinations surfaced in the mobile bottom bar. */
export const MOBILE_NAV: NavItem[] = [
  NAV[0],
  NAV[1],
  NAV[2],
  NAV[5],
];
