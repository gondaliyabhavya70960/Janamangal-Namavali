"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Maximize2, Pause, Play, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SongCover } from "@/components/shared/song-cover";
import { usePlayerStore } from "@/store/player";
import { useUIStore } from "@/store/ui";

/**
 * A draggable, always-on-top "picture-in-picture" style mini player. Built with
 * Framer Motion drag so it can be flung anywhere on screen while practising in
 * another view.
 */
export function FloatingMiniPlayer() {
  const open = useUIStore((s) => s.floatingPlayerOpen);
  const setOpen = useUIStore((s) => s.setFloatingPlayerOpen);
  const setFullPlayerOpen = useUIStore((s) => s.setFullPlayerOpen);

  const song = usePlayerStore((s) => s.currentSong);
  const playing = usePlayerStore((s) => s.playback.playing);
  const position = usePlayerStore((s) => s.playback.position);
  const duration = usePlayerStore((s) => s.playback.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {open && song && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.06}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 right-6 z-50 w-72 cursor-grab overflow-hidden rounded-2xl glass-strong shadow-2xl active:cursor-grabbing"
        >
          <div className="flex items-center gap-1 border-b border-border/50 px-2 py-1 text-muted-foreground">
            <GripVertical className="size-4" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Mini player</span>
            <div className="ml-auto flex">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => {
                  setOpen(false);
                  setFullPlayerOpen(true);
                }}
                aria-label="Expand"
              >
                <Maximize2 className="size-3.5" />
              </Button>
              <Button variant="ghost" size="iconSm" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3">
            <SongCover song={song} size="md" playing={playing} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{song.title}</p>
              <p className="truncate text-xs text-muted-foreground">{song.artist || "Unknown artist"}</p>
            </div>
            <Button size="icon" className="rounded-full" onClick={togglePlay} aria-label="Play/Pause">
              {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
            </Button>
            <Button variant="ghost" size="iconSm" onClick={() => void next()} aria-label="Next">
              <SkipForward />
            </Button>
          </div>
          <div className="h-1 bg-muted">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
