import { db } from "@/db/database";
import { toDayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import type { DailyStat, HistoryEntry } from "@/types";
import { touchSession } from "./sessions";

export interface BeginPlayContext {
  songId: string;
  songTitle: string;
  songArtist?: string;
  speed: number;
  loopId?: string;
  loopName?: string;
  online: boolean;
  deviceLabel: string;
  sessionId?: string;
}

async function upsertDailyStat(
  date: string,
  mutate: (stat: DailyStat) => DailyStat,
): Promise<void> {
  const existing = await db.dailyStats.get(date);
  const base: DailyStat = existing ?? {
    date,
    totalMs: 0,
    playCount: 0,
    sessionCount: 0,
    loopCount: 0,
    songIds: [],
  };
  await db.dailyStats.put(mutate({ ...base }));
}

/** Open a new history record for a song play and bump play counters. */
export async function beginPlay(ctx: BeginPlayContext, now: number): Promise<string> {
  const id = createId("hist");
  const date = toDayKey(now);
  const entry: HistoryEntry = {
    id,
    songId: ctx.songId,
    songTitle: ctx.songTitle,
    songArtist: ctx.songArtist,
    date,
    startedAt: now,
    endedAt: now,
    playedMs: 0,
    pausedMs: 0,
    speed: ctx.speed,
    loopId: ctx.loopId,
    loopName: ctx.loopName,
    loopCount: 0,
    deviceLabel: ctx.deviceLabel,
    online: ctx.online,
    favorite: false,
  };

  await db.transaction("rw", db.history, db.songs, db.dailyStats, async () => {
    await db.history.put(entry);
    const song = await db.songs.get(ctx.songId);
    if (song) {
      await db.songs.update(ctx.songId, {
        playCount: song.playCount + 1,
        lastPlayedAt: now,
        updatedAt: now,
      });
    }
    await upsertDailyStat(date, (stat) => {
      stat.playCount += 1;
      if (!stat.songIds.includes(ctx.songId)) stat.songIds.push(ctx.songId);
      return stat;
    });
  });
  return id;
}

export interface CommitDelta {
  deltaMs: number;
  addLoops?: number;
  pausedMs?: number;
  speed?: number;
  sessionId?: string;
}

/** Attribute a slice of *actual* listening time to a history record + rollups. */
export async function commitPlayDelta(
  historyId: string,
  songId: string,
  delta: CommitDelta,
  now: number,
): Promise<void> {
  if (delta.deltaMs <= 0 && !delta.addLoops && !delta.pausedMs) return;
  const date = toDayKey(now);

  await db.transaction("rw", db.history, db.songs, db.dailyStats, async () => {
    const entry = await db.history.get(historyId);
    if (entry) {
      await db.history.update(historyId, {
        playedMs: entry.playedMs + delta.deltaMs,
        pausedMs: entry.pausedMs + (delta.pausedMs ?? 0),
        loopCount: entry.loopCount + (delta.addLoops ?? 0),
        endedAt: now,
        speed: delta.speed ?? entry.speed,
      });
    }
    const song = await db.songs.get(songId);
    if (song) {
      await db.songs.update(songId, {
        totalPracticeMs: song.totalPracticeMs + delta.deltaMs,
        loopCountTotal: song.loopCountTotal + (delta.addLoops ?? 0),
        lastPlayedAt: now,
      });
    }
    await upsertDailyStat(date, (stat) => {
      stat.totalMs += delta.deltaMs;
      stat.loopCount += delta.addLoops ?? 0;
      if (!stat.songIds.includes(songId)) stat.songIds.push(songId);
      return stat;
    });
  });

  if (delta.sessionId) {
    await touchSession(delta.sessionId, {
      addMs: delta.deltaMs,
      addLoops: delta.addLoops,
      songId,
      endedAt: now,
    });
  }
}

export async function endPlay(historyId: string, now: number): Promise<void> {
  await db.history.update(historyId, { endedAt: now });
}

// ----- Queries -----

export function listHistory(limit?: number): Promise<HistoryEntry[]> {
  const collection = db.history.orderBy("startedAt").reverse();
  return limit ? collection.limit(limit).toArray() : collection.toArray();
}

export function listHistoryForSong(songId: string): Promise<HistoryEntry[]> {
  return db.history.where("songId").equals(songId).reverse().sortBy("startedAt");
}

export async function toggleHistoryFavorite(id: string): Promise<void> {
  const entry = await db.history.get(id);
  if (entry) await db.history.update(id, { favorite: !entry.favorite });
}

export async function setHistoryNote(id: string, notes: string): Promise<void> {
  await db.history.update(id, { notes });
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await db.history.delete(id);
}

export async function clearHistory(): Promise<void> {
  await db.history.clear();
}
