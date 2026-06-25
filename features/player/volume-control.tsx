"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/store/player";
import { cn } from "@/lib/utils";

export function VolumeControl({ className }: { className?: string }) {
  const volume = usePlayerStore((s) => s.playback.volume);
  const muted = usePlayerStore((s) => s.playback.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const effective = muted ? 0 : volume;
  const Icon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button variant="ghost" size="iconSm" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
        <Icon />
      </Button>
      <Slider
        className="w-24"
        min={0}
        max={1}
        step={0.01}
        value={[effective]}
        onValueChange={([v]) => setVolume(v)}
        aria-label="Volume"
      />
    </div>
  );
}
