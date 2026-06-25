"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/store/player";
import { cn, formatTimecode } from "@/lib/utils";

export function SeekBar({ className, hideTimes }: { className?: string; hideTimes?: boolean }) {
  const position = usePlayerStore((s) => s.playback.position);
  const duration = usePlayerStore((s) => s.playback.duration);
  const loopRegion = usePlayerStore((s) => s.loopRegion);
  const loopEnabled = usePlayerStore((s) => s.loopEnabled);
  const seek = usePlayerStore((s) => s.seek);
  const [scrub, setScrub] = useState<number | null>(null);

  const value = scrub != null ? scrub : position;
  const max = Math.max(duration, 0.1);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!hideTimes && (
        <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
          {formatTimecode(value)}
        </span>
      )}
      <div className="relative flex-1">
        {loopEnabled && loopRegion && duration > 0 && (
          <div
            className="pointer-events-none absolute top-1/2 z-10 h-1.5 -translate-y-1/2 rounded-full bg-primary/30"
            style={{
              left: `${(loopRegion.start / max) * 100}%`,
              width: `${((loopRegion.end - loopRegion.start) / max) * 100}%`,
            }}
          />
        )}
        <Slider
          min={0}
          max={max}
          step={0.05}
          value={[Math.min(value, max)]}
          onValueChange={([v]) => setScrub(v)}
          onValueCommit={([v]) => {
            seek(v);
            setScrub(null);
          }}
          aria-label="Seek"
        />
      </div>
      {!hideTimes && (
        <span className="w-10 shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {formatTimecode(duration)}
        </span>
      )}
    </div>
  );
}
