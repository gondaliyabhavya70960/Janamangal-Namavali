"use client";

import { useState } from "react";
import { Check, ListMusic, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlaylists } from "@/hooks/use-data";
import { addSongsToPlaylist, createPlaylist } from "@/services/playlists";
import { pluralize } from "@/lib/utils";

export function AddToPlaylistDialog({
  open,
  onOpenChange,
  songIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songIds: string[];
}) {
  const playlists = usePlaylists().filter((p) => !p.smart);
  const [newName, setNewName] = useState("");

  const addTo = async (playlistId: string, name: string) => {
    await addSongsToPlaylist(playlistId, songIds, Date.now());
    toast.success(`Added ${pluralize(songIds.length, "track")} to ${name}`);
    onOpenChange(false);
  };

  const createAndAdd = async () => {
    const playlist = await createPlaylist(newName, Date.now(), songIds);
    toast.success(`Created “${playlist.name}”`);
    setNewName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to playlist</DialogTitle>
          <DialogDescription>{pluralize(songIds.length, "track")} selected</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="New playlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newName.trim() && createAndAdd()}
          />
          <Button onClick={createAndAdd} disabled={!newName.trim()}>
            <Plus className="size-4" /> Create
          </Button>
        </div>

        <ScrollArea className="max-h-64">
          <div className="space-y-1 pr-3">
            {playlists.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No playlists yet — create one above.</p>
            )}
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => addTo(playlist.id, playlist.name)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
              >
                <span
                  className="grid size-9 place-items-center rounded-lg text-white"
                  style={{ background: playlist.color ?? "hsl(262 83% 60%)" }}
                >
                  <ListMusic className="size-4" />
                </span>
                <span className="flex-1 truncate text-sm font-medium">{playlist.name}</span>
                <span className="text-xs text-muted-foreground">{playlist.songIds.length}</span>
                {playlist.songIds.some((id) => songIds.includes(id)) && (
                  <Check className="size-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
