import { db } from "@/db/database";
import { blobToDataUrl, dataUrlToBlob } from "@/lib/utils";
import type { BackupFile } from "@/types";

const BACKUP_VERSION = 1;

/** Serialise the entire database (including audio) into a portable backup object. */
export async function buildBackup(now: number): Promise<BackupFile> {
  const [songs, blobs, playlists, loops, history, sessions, dailyStats, goals, settings] =
    await Promise.all([
      db.songs.toArray(),
      db.blobs.toArray(),
      db.playlists.toArray(),
      db.loops.toArray(),
      db.history.toArray(),
      db.sessions.toArray(),
      db.dailyStats.toArray(),
      db.goals.toArray(),
      db.settings.get("app"),
    ]);

  const audio: Record<string, string> = {};
  for (const blob of blobs) {
    audio[blob.songId] = await blobToDataUrl(blob.audio);
  }

  return {
    app: "riyaz",
    version: BACKUP_VERSION,
    exportedAt: now,
    songs,
    audio,
    playlists,
    loops,
    history,
    sessions,
    dailyStats,
    goals,
    settings: settings ?? null,
  };
}

export interface RestoreResult {
  songs: number;
  playlists: number;
  history: number;
}

/** Restore a backup, replacing all current data. */
export async function restoreBackup(backup: BackupFile): Promise<RestoreResult> {
  if (backup.app !== "riyaz") throw new Error("This file is not a Riyaz backup.");

  await db.transaction(
    "rw",
    [db.songs, db.blobs, db.playlists, db.loops, db.history, db.sessions, db.dailyStats, db.goals, db.settings],
    async () => {
      await Promise.all([
        db.songs.clear(),
        db.blobs.clear(),
        db.playlists.clear(),
        db.loops.clear(),
        db.history.clear(),
        db.sessions.clear(),
        db.dailyStats.clear(),
        db.goals.clear(),
      ]);

      await db.songs.bulkPut(backup.songs);
      const blobs = await Promise.all(
        Object.entries(backup.audio).map(async ([songId, dataUrl]) => ({
          songId,
          audio: await dataUrlToBlob(dataUrl),
        })),
      );
      await db.blobs.bulkPut(blobs);
      await db.playlists.bulkPut(backup.playlists);
      await db.loops.bulkPut(backup.loops);
      await db.history.bulkPut(backup.history);
      await db.sessions.bulkPut(backup.sessions);
      await db.dailyStats.bulkPut(backup.dailyStats);
      await db.goals.bulkPut(backup.goals);
      if (backup.settings) await db.settings.put(backup.settings);
    },
  );

  return {
    songs: backup.songs.length,
    playlists: backup.playlists.length,
    history: backup.history.length,
  };
}

/** Wipe the audio library (songs, blobs, loops) while keeping analytics + settings. */
export async function clearLibrary(): Promise<void> {
  await db.transaction("rw", [db.songs, db.blobs, db.loops, db.playlists], async () => {
    await db.songs.clear();
    await db.blobs.clear();
    await db.loops.clear();
    await db.playlists.clear();
  });
}

/** Full factory reset — clears every table including settings. */
export async function resetApp(): Promise<void> {
  await db.transaction(
    "rw",
    [db.songs, db.blobs, db.playlists, db.loops, db.history, db.sessions, db.dailyStats, db.goals, db.settings],
    async () => {
      await Promise.all([
        db.songs.clear(),
        db.blobs.clear(),
        db.playlists.clear(),
        db.loops.clear(),
        db.history.clear(),
        db.sessions.clear(),
        db.dailyStats.clear(),
        db.goals.clear(),
        db.settings.clear(),
      ]);
    },
  );
}

export async function estimateStorage(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usage, quota };
  }
  return null;
}

/** Whether the browser has marked our on-device storage as persistent (won't auto-evict). */
export async function isStoragePersisted(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persisted) return false;
  return navigator.storage.persisted();
}

/**
 * Ask the browser to make storage persistent so the music library is never
 * evicted under storage pressure. Auto-granted for installed PWAs / engaged
 * sites; may prompt elsewhere. Safe to call repeatedly.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
