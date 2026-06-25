"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  computeStatsSummary,
  getSong,
  listAllLoops,
  listGoals,
  listHistory,
  listHistoryForSong,
  listLoopsForSong,
  listPlaylists,
  listSessions,
  listSongs,
} from "@/services";
import { getPlaylist } from "@/services/playlists";
import type {
  Goal,
  HistoryEntry,
  LoopPreset,
  Playlist,
  PracticeSession,
  Song,
  StatsSummary,
} from "@/types";

/**
 * Reactive data hooks built on Dexie's `useLiveQuery`. Each automatically
 * re-runs when any table it touches changes — so the UI stays in sync with
 * IndexedDB with zero manual invalidation.
 */

export function useSongs(): Song[] {
  return useLiveQuery(() => listSongs(), [], [] as Song[]);
}

export function useSong(id?: string): Song | undefined {
  return useLiveQuery(() => (id ? getSong(id) : undefined), [id]);
}

export function usePlaylists(): Playlist[] {
  return useLiveQuery(() => listPlaylists(), [], [] as Playlist[]);
}

export function usePlaylist(id?: string): Playlist | undefined {
  return useLiveQuery(() => (id ? getPlaylist(id) : undefined), [id]);
}

export function useLoopsForSong(songId?: string): LoopPreset[] {
  return useLiveQuery(() => (songId ? listLoopsForSong(songId) : Promise.resolve([])), [songId], [] as LoopPreset[]);
}

export function useAllLoops(): LoopPreset[] {
  return useLiveQuery(() => listAllLoops(), [], [] as LoopPreset[]);
}

export function useHistory(limit?: number): HistoryEntry[] {
  return useLiveQuery(() => listHistory(limit), [limit], [] as HistoryEntry[]);
}

export function useHistoryForSong(songId?: string): HistoryEntry[] {
  return useLiveQuery(
    () => (songId ? listHistoryForSong(songId) : Promise.resolve([])),
    [songId],
    [] as HistoryEntry[],
  );
}

export function useSessions(): PracticeSession[] {
  return useLiveQuery(() => listSessions(), [], [] as PracticeSession[]);
}

export function useGoals(): Goal[] {
  return useLiveQuery(() => listGoals(), [], [] as Goal[]);
}

/**
 * Live statistics summary. `useLiveQuery` tracks the tables read inside
 * `computeStatsSummary`, so it recomputes whenever practice data changes.
 */
export function useStats(): StatsSummary | undefined {
  return useLiveQuery(() => computeStatsSummary(Date.now()), []);
}
