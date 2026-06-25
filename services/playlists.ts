import { db } from "@/db/database";
import { createId } from "@/lib/id";
import { colorFromString } from "@/lib/utils";
import type { Playlist, SmartPlaylistKind, Song } from "@/types";

export function listPlaylists(): Promise<Playlist[]> {
  return db.playlists.orderBy("updatedAt").reverse().toArray();
}

export function getPlaylist(id: string): Promise<Playlist | undefined> {
  return db.playlists.get(id);
}

export async function createPlaylist(name: string, now: number, songIds: string[] = []): Promise<Playlist> {
  const playlist: Playlist = {
    id: createId("pl"),
    name: name.trim() || "New Playlist",
    songIds,
    color: colorFromString(name + now),
    favorite: false,
    smart: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.playlists.put(playlist);
  return playlist;
}

export async function renamePlaylist(id: string, name: string, now: number): Promise<void> {
  await db.playlists.update(id, { name: name.trim() || "Untitled", updatedAt: now });
}

export async function updatePlaylist(id: string, patch: Partial<Playlist>, now: number): Promise<void> {
  await db.playlists.update(id, { ...patch, updatedAt: now });
}

export async function removePlaylist(id: string): Promise<void> {
  await db.playlists.delete(id);
}

export async function addSongsToPlaylist(id: string, songIds: string[], now: number): Promise<void> {
  const playlist = await db.playlists.get(id);
  if (!playlist) return;
  const merged = [...playlist.songIds];
  for (const songId of songIds) if (!merged.includes(songId)) merged.push(songId);
  await db.playlists.update(id, { songIds: merged, updatedAt: now });
}

export async function removeSongFromPlaylist(id: string, songId: string, now: number): Promise<void> {
  const playlist = await db.playlists.get(id);
  if (!playlist) return;
  await db.playlists.update(id, {
    songIds: playlist.songIds.filter((s) => s !== songId),
    updatedAt: now,
  });
}

export async function reorderPlaylist(id: string, songIds: string[], now: number): Promise<void> {
  await db.playlists.update(id, { songIds, updatedAt: now });
}

export async function togglePlaylistFavorite(id: string): Promise<void> {
  const playlist = await db.playlists.get(id);
  if (playlist) await db.playlists.update(id, { favorite: !playlist.favorite, updatedAt: Date.now() });
}

export async function togglePlaylistPinned(id: string, now: number): Promise<void> {
  const playlist = await db.playlists.get(id);
  if (playlist) await db.playlists.update(id, { pinnedAt: playlist.pinnedAt ? undefined : now, updatedAt: now });
}

export async function duplicatePlaylist(id: string, now: number): Promise<Playlist | null> {
  const playlist = await db.playlists.get(id);
  if (!playlist) return null;
  return createPlaylist(`${playlist.name} (copy)`, now, playlist.songIds.slice());
}

/** Resolve the ordered song list for a smart (computed) playlist. */
export async function resolveSmartPlaylist(kind: SmartPlaylistKind, limit = 100): Promise<Song[]> {
  const songs = await db.songs.toArray();
  switch (kind) {
    case "most-played":
      return songs
        .filter((s) => s.playCount > 0)
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit);
    case "recently-played":
      return songs
        .filter((s) => s.lastPlayedAt)
        .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0))
        .slice(0, limit);
    case "recently-added":
      return songs.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
    case "longest-practice":
      return songs
        .filter((s) => s.totalPracticeMs > 0)
        .sort((a, b) => b.totalPracticeMs - a.totalPracticeMs)
        .slice(0, limit);
    case "favorites":
      return songs.filter((s) => s.favorite).sort((a, b) => b.updatedAt - a.updatedAt);
    case "downloaded":
      // Everything is stored offline; surface local uploads first.
      return songs.sort((a, b) => Number(a.sourceType === "url") - Number(b.sourceType === "url"));
    default:
      return [];
  }
}
