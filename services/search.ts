import Fuse, { type IFuseOptions } from "fuse.js";
import type { HistoryEntry, Playlist, Song } from "@/types";

const SONG_OPTIONS: IFuseOptions<Song> = {
  keys: [
    { name: "title", weight: 0.5 },
    { name: "artist", weight: 0.2 },
    { name: "album", weight: 0.1 },
    { name: "fileName", weight: 0.1 },
    { name: "tags", weight: 0.1 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export function createSongSearcher(songs: Song[]): Fuse<Song> {
  return new Fuse(songs, SONG_OPTIONS);
}

export function searchSongs(fuse: Fuse<Song> | null, query: string, fallback: Song[]): Song[] {
  const trimmed = query.trim();
  if (!trimmed || !fuse) return fallback;
  return fuse.search(trimmed).map((r) => r.item);
}

export interface GlobalSearchResult {
  songs: Song[];
  playlists: Playlist[];
  history: HistoryEntry[];
}

/** One-shot global search across songs, playlists and history. */
export function globalSearch(
  query: string,
  data: { songs: Song[]; playlists: Playlist[]; history: HistoryEntry[] },
  limit = 6,
): GlobalSearchResult {
  const trimmed = query.trim();
  if (!trimmed) return { songs: [], playlists: [], history: [] };

  const songFuse = new Fuse(data.songs, SONG_OPTIONS);
  const playlistFuse = new Fuse(data.playlists, {
    keys: ["name", "description"],
    threshold: 0.4,
    ignoreLocation: true,
  });
  const historyFuse = new Fuse(data.history, {
    keys: ["songTitle", "songArtist", "loopName", "notes"],
    threshold: 0.4,
    ignoreLocation: true,
  });

  return {
    songs: songFuse.search(trimmed).slice(0, limit).map((r) => r.item),
    playlists: playlistFuse.search(trimmed).slice(0, limit).map((r) => r.item),
    history: historyFuse.search(trimmed).slice(0, limit).map((r) => r.item),
  };
}
