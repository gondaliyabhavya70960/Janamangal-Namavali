import { db } from "@/db/database";
import { getAudioDuration } from "@/lib/audio/decode";
import { formatFromFile } from "@/lib/constants";
import { createId } from "@/lib/id";
import { colorFromString, titleFromFileName } from "@/lib/utils";
import type { Song, SongBlob } from "@/types";

function baseSong(now: number): Omit<Song, "id" | "title" | "fileName" | "mimeType" | "format" | "size" | "duration" | "sourceType"> {
  return {
    favorite: false,
    pinned: false,
    playCount: 0,
    totalPracticeMs: 0,
    loopCountTotal: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/** Persist a single uploaded file as a song + its audio blob. */
export async function addSongFromFile(file: File, now: number): Promise<Song> {
  const blob = file.slice(0, file.size, file.type || "audio/mpeg");
  const duration = await getAudioDuration(blob);
  const id = createId("song");
  const title = titleFromFileName(file.name);
  const song: Song = {
    id,
    title,
    fileName: file.name,
    mimeType: file.type || "audio/mpeg",
    format: formatFromFile(file.name, file.type),
    size: file.size,
    duration,
    sourceType: "local",
    color: colorFromString(title),
    ...baseSong(now),
  };
  const songBlob: SongBlob = { songId: id, audio: blob };
  await db.transaction("rw", db.songs, db.blobs, async () => {
    await db.songs.put(song);
    await db.blobs.put(songBlob);
  });
  return song;
}

export async function addSongsFromFiles(
  files: File[],
  now: number,
  onProgress?: (done: number, total: number, song: Song) => void,
): Promise<Song[]> {
  const created: Song[] = [];
  for (let i = 0; i < files.length; i++) {
    const song = await addSongFromFile(files[i], now);
    created.push(song);
    onProgress?.(i + 1, files.length, song);
  }
  return created;
}

/** Import a song from a remote URL. Requires network for the initial fetch. */
export async function addSongFromUrl(url: string, now: number, titleHint?: string): Promise<Song> {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`Could not fetch audio (HTTP ${response.status}).`);
  const blob = await response.blob();
  if (!blob.type.startsWith("audio") && !/\.(mp3|wav|m4a|flac|ogg|aac|opus|webm)(\?|$)/i.test(url)) {
    throw new Error("That URL does not appear to point to an audio file.");
  }
  const fileName = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "imported-track.mp3");
  const duration = await getAudioDuration(blob);
  const id = createId("song");
  const title = titleHint?.trim() || titleFromFileName(fileName);
  const song: Song = {
    id,
    title,
    fileName,
    mimeType: blob.type || "audio/mpeg",
    format: formatFromFile(fileName, blob.type),
    size: blob.size,
    duration,
    sourceType: "url",
    sourceUrl: url,
    color: colorFromString(title),
    ...baseSong(now),
  };
  await db.transaction("rw", db.songs, db.blobs, async () => {
    await db.songs.put(song);
    await db.blobs.put({ songId: id, audio: blob });
  });
  return song;
}

export function listSongs(): Promise<Song[]> {
  return db.songs.orderBy("createdAt").reverse().toArray();
}

export function getSong(id: string): Promise<Song | undefined> {
  return db.songs.get(id);
}

export async function getSongBlob(songId: string): Promise<Blob | undefined> {
  const record = await db.blobs.get(songId);
  return record?.audio;
}

/** Resolve a playable object URL for a song. Caller is responsible for revoking. */
export async function getAudioObjectUrl(songId: string): Promise<string | null> {
  const blob = await getSongBlob(songId);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function updateSong(id: string, patch: Partial<Song>, now: number): Promise<void> {
  await db.songs.update(id, { ...patch, updatedAt: now });
}

export async function setSongPeaks(id: string, peaks: number[]): Promise<void> {
  await db.songs.update(id, { peaks });
}

export async function setSongDuration(id: string, duration: number): Promise<void> {
  if (duration > 0) await db.songs.update(id, { duration });
}

export async function toggleSongFavorite(id: string): Promise<void> {
  const song = await db.songs.get(id);
  if (song) await db.songs.update(id, { favorite: !song.favorite, updatedAt: Date.now() });
}

export async function toggleSongPinned(id: string): Promise<void> {
  const song = await db.songs.get(id);
  if (song) await db.songs.update(id, { pinned: !song.pinned, updatedAt: Date.now() });
}

/** Remove a song, its audio, its loops and any playlist memberships. History is kept for analytics. */
export async function deleteSong(id: string): Promise<void> {
  await db.transaction("rw", db.songs, db.blobs, db.loops, db.playlists, async () => {
    await db.songs.delete(id);
    await db.blobs.delete(id);
    await db.loops.where("songId").equals(id).delete();
    const playlists = await db.playlists.toArray();
    await Promise.all(
      playlists
        .filter((p) => p.songIds.includes(id))
        .map((p) =>
          db.playlists.update(p.id, { songIds: p.songIds.filter((s) => s !== id), updatedAt: Date.now() }),
        ),
    );
  });
}

export async function deleteSongs(ids: string[]): Promise<void> {
  for (const id of ids) await deleteSong(id);
}

/** Snapshot needed to undo a deletion. */
export interface DeletedSongSnapshot {
  song: Song;
  audio?: Blob;
}

/** Capture a song + its audio so a delete can be undone. */
export async function snapshotSong(id: string): Promise<DeletedSongSnapshot | null> {
  const song = await db.songs.get(id);
  if (!song) return null;
  const audio = await getSongBlob(id);
  return { song, audio };
}

/** Restore a previously-deleted song from a snapshot. */
export async function restoreSong(snapshot: DeletedSongSnapshot): Promise<void> {
  await db.transaction("rw", db.songs, db.blobs, async () => {
    await db.songs.put(snapshot.song);
    if (snapshot.audio) await db.blobs.put({ songId: snapshot.song.id, audio: snapshot.audio });
  });
}
