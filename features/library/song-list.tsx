"use client";

import { SongRow } from "./song-row";
import type { Song } from "@/types";

/** Renders a list of songs sharing one play queue context. */
export function SongList({
  songs,
  removeActionFor,
  showStats = true,
}: {
  songs: Song[];
  removeActionFor?: (song: Song) => { label: string; run: () => void } | undefined;
  showStats?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      {songs.map((song) => (
        <SongRow
          key={song.id}
          song={song}
          queue={songs}
          removeAction={removeActionFor?.(song)}
          showStats={showStats}
        />
      ))}
    </div>
  );
}
