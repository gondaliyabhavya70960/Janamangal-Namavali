"use client";

import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { MobileNav } from "@/components/mobile-nav";
import { CommandPalette } from "@/components/command-palette";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { PlayerBar } from "@/features/player/player-bar";
import { FullPlayer } from "@/features/player/full-player";
import { QueuePanel } from "@/features/player/queue-panel";
import { FloatingMiniPlayer } from "@/features/player/floating-mini-player";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function AppShell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
        <PlayerBar />
        <MobileNav />
      </div>

      {/* Global, portaled overlays */}
      <FullPlayer />
      <QueuePanel />
      <FloatingMiniPlayer />
      <CommandPalette />
      <ShortcutsDialog />
    </div>
  );
}
