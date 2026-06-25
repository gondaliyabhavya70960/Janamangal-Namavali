"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Copy, GripVertical, Heart, ListMusic, Pencil, Play, Shuffle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SongRow } from "@/features/library/song-row";
import { SongList } from "@/features/library/song-list";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePlaylist, useSongs } from "@/hooks/use-data";
import { usePlayerStore } from "@/store/player";
import {
  duplicatePlaylist,
  removePlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
  reorderPlaylist,
  togglePlaylistFavorite,
  resolveSmartPlaylist,
} from "@/services/playlists";
import { SMART_PLAYLISTS } from "@/lib/constants";
import { cn, formatDurationMs, pluralize } from "@/lib/utils";
import type { SmartPlaylistKind, Song } from "@/types";

export function PlaylistDetail({ id }: { id: string }) {
  const router = useRouter();
  const isSmart = id.startsWith("smart-");
  const smartKind = id.replace("smart-", "") as SmartPlaylistKind;

  const allSongs = useSongs();
  const playlist = usePlaylist(isSmart ? undefined : id);
  const smartSongs = useLiveQuery(
    () => (isSmart ? resolveSmartPlaylist(smartKind) : Promise.resolve<Song[]>([])),
    [id],
    [] as Song[],
  );

  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const loadQueue = usePlayerStore((s) => s.loadQueue);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  const songs = useMemo(() => {
    if (isSmart) return smartSongs ?? [];
    if (!playlist) return [];
    const map = new Map(allSongs.map((s) => [s.id, s]));
    return playlist.songIds.map((sid) => map.get(sid)).filter((s): s is Song => !!s);
  }, [isSmart, smartSongs, playlist, allSongs]);

  const meta = isSmart ? SMART_PLAYLISTS.find((s) => s.kind === smartKind) : null;
  const title = isSmart ? meta?.name ?? "Playlist" : playlist?.name ?? "Playlist";
  const description = isSmart ? meta?.description : playlist?.description;
  const color = isSmart ? "hsl(262 83% 60%)" : playlist?.color ?? "hsl(262 83% 60%)";
  const totalMs = songs.reduce((t, s) => t + s.duration * 1000, 0);

  const onDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex || !playlist) return;
    const next = playlist.songIds.slice();
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    await reorderPlaylist(playlist.id, next, Date.now());
  };

  if (!isSmart && playlist === undefined) {
    return <p className="py-20 text-center text-muted-foreground">Loading playlist…</p>;
  }
  if (!isSmart && playlist === null) {
    return <EmptyState icon={ListMusic} title="Playlist not found" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div
          className="grid size-40 shrink-0 place-items-center rounded-3xl text-white/90 shadow-lg"
          style={{ background: `linear-gradient(140deg, ${color}, hsl(240 10% 12%))` }}
        >
          <ListMusic className="size-16" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isSmart ? "Smart playlist" : "Playlist"}
          </p>
          {renaming && playlist ? (
            <Input
              autoFocus
              value={name}
              className="h-12 text-2xl font-bold"
              onChange={(e) => setName(e.target.value)}
              onBlur={async () => {
                await renamePlaylist(playlist.id, name, Date.now());
                setRenaming(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          )}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <p className="text-sm text-muted-foreground">
            {pluralize(songs.length, "track")} · {formatDurationMs(totalMs)}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button onClick={() => songs.length && loadQueue(songs, 0, true)} disabled={!songs.length}>
              <Play className="size-4 fill-current" /> Play
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (!songs.length) return;
                toggleShuffle();
                void loadQueue(songs, 0, true);
              }}
              disabled={!songs.length}
            >
              <Shuffle className="size-4" /> Shuffle
            </Button>
            {!isSmart && playlist && (
              <>
                <Button variant="ghost" size="icon" onClick={() => togglePlaylistFavorite(playlist.id)} aria-label="Favorite">
                  <Heart className={cn("size-5", playlist.favorite && "fill-primary text-primary")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setName(playlist.name);
                    setRenaming(true);
                  }}
                  aria-label="Rename"
                >
                  <Pencil className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    const copy = await duplicatePlaylist(playlist.id, Date.now());
                    if (copy) {
                      toast.success("Playlist duplicated");
                      router.push(`/playlists/${copy.id}`);
                    }
                  }}
                  aria-label="Duplicate"
                >
                  <Copy className="size-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Delete">
                  <Trash2 className="size-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {songs.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="No tracks here yet"
          description={isSmart ? "This collection fills up as you practise." : "Add songs from your library via the ⋯ menu."}
        />
      ) : isSmart ? (
        <SongList songs={songs} />
      ) : (
        <div className="space-y-0.5">
          {songs.map((song, index) => (
            <div
              key={song.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(index)}
              className={cn("flex items-center gap-1", dragIndex === index && "opacity-50")}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/50" />
              <div className="min-w-0 flex-1">
                <SongRow
                  song={song}
                  queue={songs}
                  removeAction={{
                    label: "Remove from playlist",
                    run: () => playlist && void removeSongFromPlaylist(playlist.id, song.id, Date.now()),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete playlist?"
        description="This removes the playlist. Your tracks stay in your library."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (playlist) {
            await removePlaylist(playlist.id);
            router.push("/playlists");
          }
        }}
      />
    </div>
  );
}
