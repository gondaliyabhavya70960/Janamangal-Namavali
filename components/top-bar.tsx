"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Menu, Search, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV } from "@/components/nav";
import { useUIStore } from "@/store/ui";
import { useOnline, usePwaInstall } from "@/hooks/use-pwa";
import { cn } from "@/lib/utils";

export function TopBar() {
  const pathname = usePathname();
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const online = useOnline();
  const { canInstall, promptInstall } = usePwaInstall();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/70 px-3 py-2.5 backdrop-blur-xl sm:px-4">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <Logo />
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 px-3">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <SheetTrigger asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <item.icon className="size-[18px]" />
                    {item.label}
                  </Link>
                </SheetTrigger>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <Logo withWordmark={false} className="lg:hidden" />

      {/* Search / command trigger */}
      <button
        onClick={() => setCommandOpen(true)}
        className="group flex h-9 flex-1 items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-card/70 sm:max-w-md"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {!online && (
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <WifiOff className="size-3.5" /> Offline
          </span>
        )}
        {canInstall && (
          <Button variant="outline" size="sm" onClick={() => void promptInstall()}>
            <Download className="size-4" /> <span className="hidden sm:inline">Install</span>
          </Button>
        )}
      </div>
    </header>
  );
}
