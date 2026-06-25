"use client";

import { ChevronUp, Heart, ListMusic, Pause, Play, PictureInPicture2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { SongCover } from "@/components/shared/song-cover";
import { TransportControls } from "./transport-controls";
import { SeekBar } from "./seek-bar";
import { SpeedControl } from "./speed-control";
import { LoopControls } from "./loop-controls";
import { VolumeControl } from "./volume-control";
import { useSong } from "@/hooks/use-data";
import { usePlayerStore } from "@/store/player";
import { useUIStore } from "@/store/ui";
import { toggleSongFavorite } from "@/services/songs";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const liveSong = useSong(currentSong?.id);
  const song = liveSong ?? currentSong;
  const playing = usePlayerStore((s) => s.playback.playing);
  const position = usePlayerStore((s) => s.playback.position);
  const duration = usePlayerStore((s) => s.playback.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);

  const setFullPlayerOpen = useUIStore((s) => s.setFullPlayerOpen);
  const setFloating = useUIStore((s) => s.setFloatingPlayerOpen);
  const setQueueOpen = useUIStore((s) => s.setQueueOpen);

  if (!song) return null;
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className="relative z-30 shrink-0 border-t border-border/60 glass">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-muted">
        <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
        {/* Track */}
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left sm:flex-none sm:w-64"
          onClick={() => setFullPlayerOpen(true)}
          aria-label="Open full player"
        >
          <SongCover song={song} size="md" playing={playing} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{song.title}</p>
            <p className="truncate text-xs text-muted-foreground">{song.artist || "Unknown artist"}</p>
          </div>
        </button>

        <Hint label="Favorite (F)">
          <Button
            variant="ghost"
            size="iconSm"
            className="hidden sm:inline-flex"
            onClick={() => toggleSongFavorite(song.id)}
            aria-label="Favorite"
          >
            <Heart className={cn("size-4", song.favorite && "fill-primary text-primary")} />
          </Button>
        </Hint>

        {/* Center transport (desktop) */}
        <div className="hidden flex-1 flex-col items-center gap-1 md:flex">
          <TransportControls />
          <SeekBar className="w-full max-w-xl" />
        </div>

        {/* Right controls */}
        <div className="hidden items-center gap-1 lg:flex">
          <SpeedControl />
          <LoopControls compact />
          <VolumeControl />
        </div>

        <div className="flex items-center gap-1">
          <Hint label="Queue">
            <Button
              variant="ghost"
              size="iconSm"
              className="hidden sm:inline-flex"
              onClick={() => setQueueOpen(true)}
              aria-label="Queue"
            >
              <ListMusic />
            </Button>
          </Hint>
          <Hint label="Floating player">
            <Button
              variant="ghost"
              size="iconSm"
              className="hidden sm:inline-flex"
              onClick={() => setFloating(true)}
              aria-label="Floating player"
            >
              <PictureInPicture2 />
            </Button>
          </Hint>

          {/* Mobile transport */}
          <Button size="icon" className="rounded-full md:hidden" onClick={togglePlay} aria-label="Play/Pause">
            {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          </Button>
          <Button variant="ghost" size="iconSm" className="md:hidden" onClick={() => void next()} aria-label="Next">
            <SkipForward />
          </Button>
          <Button
            variant="ghost"
            size="iconSm"
            className="md:hidden"
            onClick={() => setFullPlayerOpen(true)}
            aria-label="Expand"
          >
            <ChevronUp />
          </Button>
        </div>
      </div>
    </div>
  );
}
