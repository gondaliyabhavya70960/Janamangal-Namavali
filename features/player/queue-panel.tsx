"use client";

import { ListMusic } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SongCover } from "@/components/shared/song-cover";
import { EmptyState } from "@/components/shared/empty-state";
import { usePlayerStore } from "@/store/player";
import { useUIStore } from "@/store/ui";
import { cn, formatTimecode } from "@/lib/utils";

export function QueuePanel() {
  const open = useUIStore((s) => s.queueOpen);
  const setOpen = useUIStore((s) => s.setQueueOpen);
  const queue = usePlayerStore((s) => s.queue);
  const shuffledQueue = usePlayerStore((s) => s.shuffledQueue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const playAt = usePlayerStore((s) => s.playAt);

  const list = shuffledQueue ?? queue;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Up next</SheetTitle>
          <SheetDescription>{list.length} tracks in queue</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 px-3 pb-6">
          {list.length === 0 ? (
            <EmptyState icon={ListMusic} title="Queue is empty" description="Play a song to build a queue." />
          ) : (
            <ul className="space-y-1">
              {list.map((song, index) => {
                const active = index === currentIndex;
                return (
                  <li key={`${song.id}-${index}`}>
                    <button
                      onClick={() => void playAt(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent",
                        active && "bg-primary/10",
                      )}
                    >
                      <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">
                        {active ? "▶" : index + 1}
                      </span>
                      <SongCover song={song} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm font-medium", active && "text-primary")}>
                          {song.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {song.artist || "Unknown artist"}
                        </span>
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatTimecode(song.duration)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
