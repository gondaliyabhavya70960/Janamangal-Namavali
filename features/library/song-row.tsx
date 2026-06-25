"use client";

import { useState } from "react";
import {
  Heart,
  ListEnd,
  ListPlus,
  ListX,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SongCover } from "@/components/shared/song-cover";
import { AddToPlaylistDialog } from "./add-to-playlist-dialog";
import { usePlayerStore } from "@/store/player";
import { useUIStore } from "@/store/ui";
import {
  deleteSong,
  restoreSong,
  snapshotSong,
  toggleSongFavorite,
  toggleSongPinned,
  updateSong,
} from "@/services/songs";
import { cn, formatDurationCompact, formatTimecode } from "@/lib/utils";
import type { Song } from "@/types";

export function SongRow({
  song,
  queue,
  removeAction,
  showStats = true,
}: {
  song: Song;
  queue?: Song[];
  removeAction?: { label: string; run: () => void };
  showStats?: boolean;
}) {
  const playSong = usePlayerStore((s) => s.playSong);
  const enqueueNext = usePlayerStore((s) => s.enqueueNext);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const currentId = usePlayerStore((s) => s.currentSong?.id);
  const playing = usePlayerStore((s) => s.playback.playing);

  const isSelected = useUIStore((s) => s.selectedSongIds.includes(song.id));
  const toggleSelection = useUIStore((s) => s.toggleSongSelection);
  const selectionActive = useUIStore((s) => s.selectedSongIds.length > 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(song.title);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const isCurrent = currentId === song.id;

  const handleDelete = async () => {
    const snapshot = await snapshotSong(song.id);
    await deleteSong(song.id);
    toast("Track deleted", {
      description: song.title,
      action: snapshot
        ? { label: "Undo", onClick: () => void restoreSong(snapshot) }
        : undefined,
    });
  };

  const commitRename = async () => {
    await updateSong(song.id, { title: name.trim() || song.title }, Date.now());
    setRenaming(false);
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-accent/60",
          isCurrent && "bg-primary/5",
          isSelected && "bg-primary/10 ring-1 ring-primary/30",
        )}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuOpen(true);
        }}
        onDoubleClick={() => void playSong(song, queue)}
      >
        {/* Cover / select / play */}
        <div className="relative shrink-0">
          <button
            className={cn(
              "absolute -left-1 -top-1 z-10 grid size-4 place-items-center rounded-full border border-border bg-background transition-opacity",
              selectionActive || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              isSelected && "border-primary bg-primary text-primary-foreground",
            )}
            onClick={() => toggleSelection(song.id)}
            aria-label="Select"
          >
            {isSelected && <Plus className="size-3 rotate-45" />}
          </button>
          <button className="relative" onClick={() => void playSong(song, queue)} aria-label={`Play ${song.title}`}>
            <SongCover song={song} size="sm" playing={isCurrent && playing} />
            {!isCurrent && (
              <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="size-4 fill-white text-white" />
              </span>
            )}
          </button>
        </div>

        {/* Title / artist */}
        <div className="min-w-0 flex-1">
          {renaming ? (
            <Input
              autoFocus
              value={name}
              className="h-8"
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") void commitRename();
                if (e.key === "Escape") setRenaming(false);
              }}
            />
          ) : (
            <>
              <p className={cn("truncate text-sm font-medium", isCurrent && "text-primary")}>{song.title}</p>
              <p className="truncate text-xs text-muted-foreground">{song.artist || "Unknown artist"}</p>
            </>
          )}
        </div>

        {/* Stats */}
        {showStats && (
          <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
            {song.playCount > 0 && <span className="tabular-nums">{song.playCount} plays</span>}
            {song.totalPracticeMs > 0 && (
              <span className="tabular-nums">{formatDurationCompact(song.totalPracticeMs)}</span>
            )}
          </div>
        )}

        {song.pinned && <Pin className="size-3.5 text-muted-foreground" />}
        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
          {formatTimecode(song.duration)}
        </span>

        <Button
          variant="ghost"
          size="iconSm"
          className={cn("opacity-0 transition-opacity group-hover:opacity-100", song.favorite && "opacity-100")}
          onClick={() => toggleSongFavorite(song.id)}
          aria-label="Favorite"
        >
          <Heart className={cn("size-4", song.favorite && "fill-primary text-primary")} />
        </Button>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="iconSm" aria-label="More options">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => void playSong(song, queue)}>
              <Play /> Play
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => enqueueNext(song)}>
              <ListPlus /> Play next
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addToQueue(song)}>
              <ListEnd /> Add to queue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlaylistOpen(true)}>
              <Plus /> Add to playlist…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toggleSongFavorite(song.id)}>
              <Heart /> {song.favorite ? "Remove favorite" : "Add to favorites"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleSongPinned(song.id)}>
              {song.pinned ? <PinOff /> : <Pin />} {song.pinned ? "Unpin" : "Pin to top"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setName(song.title);
                setRenaming(true);
              }}
            >
              <Pencil /> Rename
            </DropdownMenuItem>
            {removeAction && (
              <DropdownMenuItem onClick={removeAction.run}>
                <ListX /> {removeAction.label}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={handleDelete}>
              <Trash2 /> Delete from library
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AddToPlaylistDialog open={playlistOpen} onOpenChange={setPlaylistOpen} songIds={[song.id]} />
    </>
  );
}
