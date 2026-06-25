"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePlayerStore } from "@/store/player";
import { SLEEP_TIMER_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function useCountdown(endsAt: number | null) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return remaining;
}

export function SleepTimer() {
  const sleepEndsAt = usePlayerStore((s) => s.sleepEndsAt);
  const setSleepTimer = usePlayerStore((s) => s.setSleepTimer);
  const remaining = useCountdown(sleepEndsAt);

  const active = sleepEndsAt != null;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={active ? "secondary" : "ghost"}
          size="sm"
          className={cn("gap-1.5 tabular-nums", active && "text-primary")}
          aria-label="Sleep timer"
        >
          <Moon className="size-4" />
          {active && `${minutes}:${seconds.toString().padStart(2, "0")}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 space-y-3">
        <div>
          <p className="text-sm font-semibold">Sleep timer</p>
          <p className="text-xs text-muted-foreground">Pause playback automatically.</p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {SLEEP_TIMER_OPTIONS.map((value) => (
            <Button key={value} variant="secondary" size="sm" onClick={() => setSleepTimer(value)}>
              {value}
            </Button>
          ))}
        </div>
        {active && (
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setSleepTimer(null)}>
            Cancel timer
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
