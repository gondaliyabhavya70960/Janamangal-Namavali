"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Keyboard } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NAV } from "@/components/nav";
import { useStats } from "@/hooks/use-data";
import { useUIStore } from "@/store/ui";
import { cn, formatDurationMs } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const stats = useStats();
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-card/30 lg:flex">
      <div className="p-5">
        <Link href="/" aria-label="Riyaz home">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 p-3">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Flame className="size-4 text-primary" />
            <span className="font-semibold">{stats?.currentStreak ?? 0} day streak</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDurationMs(stats?.todayMs ?? 0)} practiced today
          </p>
        </div>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Keyboard className="size-4" /> Keyboard shortcuts
          <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">?</kbd>
        </button>
      </div>
    </aside>
  );
}
