"use client";

import { Repeat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { usePlayerStore } from "@/store/player";
import { cn, formatTimecodePrecise } from "@/lib/utils";

export function LoopControls({ compact, className }: { compact?: boolean; className?: string }) {
  const loopRegion = usePlayerStore((s) => s.loopRegion);
  const loopEnabled = usePlayerStore((s) => s.loopEnabled);
  const setLoopStart = usePlayerStore((s) => s.setLoopStart);
  const setLoopEnd = usePlayerStore((s) => s.setLoopEnd);
  const toggleLoop = usePlayerStore((s) => s.toggleLoop);
  const clearLoop = usePlayerStore((s) => s.clearLoop);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Hint label="Set loop start ([)">
        <Button variant="secondary" size="iconSm" className="font-semibold" onClick={() => setLoopStart()}>
          A
        </Button>
      </Hint>
      <Hint label="Set loop end (])">
        <Button variant="secondary" size="iconSm" className="font-semibold" onClick={() => setLoopEnd()}>
          B
        </Button>
      </Hint>
      <Hint label="Toggle loop (L)">
        <Button
          variant={loopEnabled ? "default" : "ghost"}
          size="iconSm"
          onClick={toggleLoop}
          aria-pressed={loopEnabled}
          aria-label="Toggle loop"
        >
          <Repeat />
        </Button>
      </Hint>

      {loopRegion && !compact && (
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1 text-[11px] tabular-nums text-muted-foreground">
          <span>
            {formatTimecodePrecise(loopRegion.start)} → {formatTimecodePrecise(loopRegion.end)}
          </span>
          {loopRegion.count > 0 && <span className="text-primary">×{loopRegion.count}</span>}
        </div>
      )}

      {loopRegion && (
        <Hint label="Clear loop (\\)">
          <Button variant="ghost" size="iconSm" onClick={clearLoop} aria-label="Clear loop">
            <X />
          </Button>
        </Hint>
      )}
    </div>
  );
}
