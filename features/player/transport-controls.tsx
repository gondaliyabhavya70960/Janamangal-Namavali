"use client";

import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { usePlayerStore } from "@/store/player";
import { cn } from "@/lib/utils";

export function TransportControls({ size = "md" }: { size?: "md" | "lg" }) {
  const playing = usePlayerStore((s) => s.playback.playing);
  const ready = usePlayerStore((s) => s.playback.ready);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  const big = size === "lg";

  return (
    <div className={cn("flex items-center", big ? "gap-3" : "gap-1.5")}>
      <Hint label="Shuffle (S)">
        <Button
          variant="ghost"
          size="iconSm"
          onClick={toggleShuffle}
          className={cn(shuffle && "text-primary")}
          aria-pressed={shuffle}
          aria-label="Shuffle"
        >
          <Shuffle />
        </Button>
      </Hint>

      <Hint label="Previous (⇧P)">
        <Button variant="ghost" size={big ? "icon" : "iconSm"} onClick={() => void previous()} aria-label="Previous">
          <SkipBack className={big ? "!size-5" : ""} />
        </Button>
      </Hint>

      <Hint label={playing ? "Pause (Space)" : "Play (Space)"}>
        <Button
          size={big ? "iconLg" : "icon"}
          onClick={togglePlay}
          disabled={!ready}
          className={cn("rounded-full", big && "glow-primary")}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className={cn("fill-current", big && "!size-6")} />
          ) : (
            <Play className={cn("fill-current", big && "!size-6")} />
          )}
        </Button>
      </Hint>

      <Hint label="Next (⇧N)">
        <Button variant="ghost" size={big ? "icon" : "iconSm"} onClick={() => void next()} aria-label="Next">
          <SkipForward className={big ? "!size-5" : ""} />
        </Button>
      </Hint>

      <Hint label={`Repeat: ${repeat}`}>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={cycleRepeat}
          className={cn(repeat !== "off" && "text-primary")}
          aria-label={`Repeat ${repeat}`}
        >
          {repeat === "one" ? <Repeat1 /> : <Repeat />}
        </Button>
      </Hint>
    </div>
  );
}
