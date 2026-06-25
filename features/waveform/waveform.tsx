"use client";

import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/dist/plugins/regions.esm.js";
import { getAudioEngine } from "@/lib/audio/engine";
import { usePlayerStore } from "@/store/player";
import { setSongPeaks } from "@/services/songs";
import type { Song } from "@/types";
import { cn } from "@/lib/utils";

function cssColor(variable: string, alpha = 1): string {
  if (typeof window === "undefined") return "#7c5cf6";
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return alpha === 1 ? `hsl(${value})` : `hsl(${value} / ${alpha})`;
}

/**
 * Renders the current song's waveform and binds WaveSurfer to the *same* media
 * element the engine plays, so the cursor, click-to-seek and loop region stay
 * perfectly in sync with playback. The loop region is fully draggable/resizable
 * and writes back to the player store.
 */
export function Waveform({
  song,
  height = 96,
  className,
}: {
  song: Song;
  height?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);
  const loopRef = useRef<Region | null>(null);
  const syncingRef = useRef(false);

  const setLoopRegion = usePlayerStore((s) => s.setLoopRegion);

  // (Re)create WaveSurfer whenever the track changes.
  useEffect(() => {
    if (!containerRef.current) return;
    const engine = getAudioEngine();

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      media: engine.media,
      height,
      waveColor: cssColor("--muted-foreground", 0.35),
      progressColor: cssColor("--primary"),
      cursorColor: cssColor("--foreground", 0.6),
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 3,
      normalize: true,
      dragToSeek: true,
      peaks: song.peaks && song.peaks.length ? [Float32Array.from(song.peaks)] : undefined,
      duration: song.duration || undefined,
      plugins: [regions],
    });
    wsRef.current = ws;

    // Persist generated peaks the first time so future loads are instant.
    ws.on("decode", () => {
      if (!song.peaks || song.peaks.length === 0) {
        try {
          const peaks = ws.exportPeaks({ maxLength: 1000 })[0];
          if (peaks) void setSongPeaks(song.id, Array.from(peaks, (p) => Math.abs(p)));
        } catch {
          /* exportPeaks can throw before decode on some inputs — ignore */
        }
      }
    });

    regions.enableDragSelection({ color: cssColor("--primary", 0.18) });

    const applyRegion = (region: Region) => {
      // Keep a single loop region.
      regions.getRegions().forEach((r) => {
        if (r.id !== region.id) r.remove();
      });
      loopRef.current = region;
      if (syncingRef.current) return;
      setLoopRegion(region.start, region.end);
    };

    regions.on("region-created", applyRegion);
    regions.on("region-updated", applyRegion);

    return () => {
      regionsRef.current = null;
      loopRef.current = null;
      ws.destroy();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.id]);

  // Reflect external loop changes (keyboard, presets, clear) into the waveform.
  const loopRegion = usePlayerStore((s) => s.loopRegion);
  useEffect(() => {
    const regions = regionsRef.current;
    if (!regions) return;
    syncingRef.current = true;
    if (!loopRegion) {
      regions.getRegions().forEach((r) => r.remove());
      loopRef.current = null;
    } else {
      const existing = loopRef.current;
      const matches =
        existing && Math.abs(existing.start - loopRegion.start) < 0.05 && Math.abs(existing.end - loopRegion.end) < 0.05;
      if (!matches) {
        regions.getRegions().forEach((r) => r.remove());
        loopRef.current = regions.addRegion({
          start: loopRegion.start,
          end: loopRegion.end,
          color: cssColor("--primary", 0.16),
          drag: true,
          resize: true,
        });
      }
    }
    const id = setTimeout(() => (syncingRef.current = false), 60);
    return () => clearTimeout(id);
  }, [loopRegion]);

  return (
    <div className={cn("waveform-host w-full", className)}>
      <div ref={containerRef} className="w-full" style={{ minHeight: height }} />
    </div>
  );
}
