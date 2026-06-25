"use client";

import { useState } from "react";
import { Bookmark, Heart, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyState } from "@/components/shared/empty-state";
import { useLoopsForSong } from "@/hooks/use-data";
import { usePlayerStore } from "@/store/player";
import { createLoop, removeLoop, toggleLoopFavorite, updateLoop } from "@/services/loops";
import { cn, formatTimecodePrecise } from "@/lib/utils";
import type { Song } from "@/types";

export function LoopManager({ song }: { song: Song }) {
  const loops = useLoopsForSong(song.id);
  const loopRegion = usePlayerStore((s) => s.loopRegion);
  const activeLoopPresetId = usePlayerStore((s) => s.activeLoopPresetId);
  const setLoopRegion = usePlayerStore((s) => s.setLoopRegion);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const saveCurrent = async () => {
    if (!loopRegion) {
      toast.error("Set a loop first (keys A / B)");
      return;
    }
    await createLoop({
      songId: song.id,
      name: name.trim() || `Loop ${loops.length + 1}`,
      start: loopRegion.start,
      end: loopRegion.end,
      now: Date.now(),
    });
    setName("");
    toast.success("Loop saved");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Bookmark className="size-4 text-primary" /> Loop presets
        </h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="secondary" disabled={!loopRegion}>
              <Plus className="size-4" /> Save loop
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-2">
            <p className="text-xs text-muted-foreground">
              {loopRegion
                ? `${formatTimecodePrecise(loopRegion.start)} → ${formatTimecodePrecise(loopRegion.end)}`
                : "No loop selected"}
            </p>
            <Input
              autoFocus
              placeholder="Loop name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveCurrent()}
            />
            <Button size="sm" className="w-full" onClick={saveCurrent}>
              Save preset
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {loops.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No saved loops"
          description="Drag on the waveform or press A then B, then save the region as a preset."
          className="py-8"
        />
      ) : (
        <ul className="space-y-1.5">
          {loops.map((loop) => {
            const active = activeLoopPresetId === loop.id;
            return (
              <li
                key={loop.id}
                className={cn(
                  "group flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-2 transition-colors",
                  active && "border-primary/50 bg-primary/5",
                )}
              >
                <button
                  className="flex flex-1 items-center gap-3 text-left"
                  onClick={() => setLoopRegion(loop.start, loop.end, loop.id)}
                >
                  <span
                    className="grid size-8 place-items-center rounded-lg text-primary"
                    style={{ background: `${loop.color ?? "hsl(262 83% 60%)"}22` }}
                  >
                    <Repeat className="size-4" />
                  </span>
                  <span className="min-w-0">
                    {editingId === loop.id ? (
                      <Input
                        autoFocus
                        value={editName}
                        className="h-7"
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={async () => {
                          await updateLoop(loop.id, { name: editName.trim() || loop.name }, Date.now());
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      />
                    ) : (
                      <span className="block truncate text-sm font-medium">{loop.name}</span>
                    )}
                    <span className="block text-[11px] tabular-nums text-muted-foreground">
                      {formatTimecodePrecise(loop.start)} → {formatTimecodePrecise(loop.end)} · ×{loop.playCount}
                    </span>
                  </span>
                </button>
                <div className="flex items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => toggleLoopFavorite(loop.id)}
                    aria-label="Favorite loop"
                  >
                    <Heart className={cn("size-4", loop.favorite && "fill-primary text-primary")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => {
                      setEditingId(loop.id);
                      setEditName(loop.name);
                    }}
                    aria-label="Rename loop"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => removeLoop(loop.id)}
                    aria-label="Delete loop"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
