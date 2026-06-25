"use client";

import { Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePlayerStore } from "@/store/player";
import { PLAYBACK_SPEEDS } from "@/types";
import { cn } from "@/lib/utils";

export function SpeedControl({ triggerClassName }: { triggerClassName?: string }) {
  const speed = usePlayerStore((s) => s.playback.speed);
  const preservePitch = usePlayerStore((s) => s.playback.preservePitch);
  const setSpeed = usePlayerStore((s) => s.setSpeed);
  const setPreservePitch = usePlayerStore((s) => s.setPreservePitch);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={speed !== 1 ? "secondary" : "ghost"}
          size="sm"
          className={cn("min-w-[3.25rem] tabular-nums", speed !== 1 && "text-primary", triggerClassName)}
          aria-label="Playback speed"
        >
          <Gauge className="size-4" />
          {speed.toFixed(2).replace(/0$/, "")}×
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Playback speed</p>
          <p className="text-xs text-muted-foreground">Practice slow without changing the pitch.</p>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {PLAYBACK_SPEEDS.map((value) => (
            <Button
              key={value}
              variant={Math.abs(value - speed) < 0.001 ? "default" : "secondary"}
              size="sm"
              className="tabular-nums"
              onClick={() => setSpeed(value)}
            >
              {value}×
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Fine tune</span>
            <span className="tabular-nums">{speed.toFixed(2)}×</span>
          </div>
          <Slider
            min={0.25}
            max={2}
            step={0.01}
            value={[speed]}
            onValueChange={([v]) => setSpeed(Number(v.toFixed(2)))}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <Label htmlFor="preserve-pitch" className="cursor-pointer text-sm">
            Preserve pitch
          </Label>
          <Switch id="preserve-pitch" checked={preservePitch} onCheckedChange={setPreservePitch} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
