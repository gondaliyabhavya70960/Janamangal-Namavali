"use client";

import { ChevronDown, Heart, PictureInPicture2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { SongCover } from "@/components/shared/song-cover";
import { Waveform } from "@/features/waveform/waveform";
import { LoopManager } from "@/features/loops/loop-manager";
import { TransportControls } from "./transport-controls";
import { SeekBar } from "./seek-bar";
import { SpeedControl } from "./speed-control";
import { LoopControls } from "./loop-controls";
import { SleepTimer } from "./sleep-timer";
import { VolumeControl } from "./volume-control";
import { useSong } from "@/hooks/use-data";
import { usePlayerStore } from "@/store/player";
import { useUIStore } from "@/store/ui";
import { toggleSongFavorite } from "@/services/songs";
import { cn, formatDurationMs } from "@/lib/utils";

export function FullPlayer() {
  const open = useUIStore((s) => s.fullPlayerOpen);
  const setOpen = useUIStore((s) => s.setFullPlayerOpen);
  const setFloating = useUIStore((s) => s.setFloatingPlayerOpen);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const liveSong = useSong(currentSong?.id);
  const song = liveSong ?? currentSong;
  const playing = usePlayerStore((s) => s.playback.playing);

  if (!song) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        hideClose
        className="flex h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:rounded-3xl"
      >
        <DialogTitle className="sr-only">Now playing: {song.title}</DialogTitle>

        <header className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <Button variant="ghost" size="iconSm" onClick={() => setOpen(false)} aria-label="Minimize">
            <ChevronDown />
          </Button>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Now Playing</span>
          <Hint label="Pop out floating player">
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => {
                setFloating(true);
                setOpen(false);
              }}
              aria-label="Floating player"
            >
              <PictureInPicture2 />
            </Button>
          </Hint>
        </header>

        <div className="grid flex-1 gap-6 overflow-y-auto p-5 lg:grid-cols-[1.4fr_1fr] lg:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <SongCover song={song} size="lg" playing={playing} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl font-bold tracking-tight">{song.title}</h2>
                <p className="truncate text-muted-foreground">{song.artist || "Unknown artist"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="muted">{song.format.toUpperCase()}</Badge>
                  <Badge variant="muted">{formatDurationMs(song.totalPracticeMs)} practiced</Badge>
                  {song.sourceType === "url" && <Badge variant="muted">Imported</Badge>}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleSongFavorite(song.id)}
                aria-label="Favorite"
              >
                <Heart className={cn("size-5", song.favorite && "fill-primary text-primary")} />
              </Button>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
              <Waveform song={song} height={120} />
            </div>

            <div className="space-y-4">
              <SeekBar />
              <div className="flex flex-col items-center gap-4">
                <TransportControls size="lg" />
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <SpeedControl />
                  <LoopControls compact />
                  <SleepTimer />
                  <VolumeControl />
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <LoopManager song={song} />
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
