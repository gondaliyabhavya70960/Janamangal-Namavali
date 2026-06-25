"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Play, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddToPlaylistDialog } from "./add-to-playlist-dialog";
import { useUIStore } from "@/store/ui";
import { usePlayerStore } from "@/store/player";
import { deleteSong, restoreSong, snapshotSong, updateSong } from "@/services/songs";
import { pluralize } from "@/lib/utils";
import type { Song } from "@/types";

export function SelectionBar({ songs }: { songs: Song[] }) {
  const selectedIds = useUIStore((s) => s.selectedSongIds);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const loadQueue = usePlayerStore((s) => s.loadQueue);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const selected = songs.filter((s) => selectedIds.includes(s.id));

  const playAll = () => {
    if (selected.length) void loadQueue(selected, 0, true);
  };

  const favoriteAll = async () => {
    await Promise.all(selected.map((s) => updateSong(s.id, { favorite: true }, Date.now())));
    toast.success(`Favorited ${pluralize(selected.length, "track")}`);
  };

  const deleteAll = async () => {
    const snapshots = await Promise.all(selected.map((s) => snapshotSong(s.id)));
    await Promise.all(selected.map((s) => deleteSong(s.id)));
    clearSelection();
    toast(`Deleted ${pluralize(selected.length, "track")}`, {
      action: {
        label: "Undo",
        onClick: () => snapshots.forEach((snap) => snap && void restoreSong(snap)),
      },
    });
  };

  return (
    <>
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center px-4 md:bottom-32"
          >
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl glass-strong p-1.5 pl-3 shadow-2xl">
              <span className="mr-1 text-sm font-medium tabular-nums">
                {pluralize(selectedIds.length, "selected", "selected")}
              </span>
              <Button size="sm" onClick={playAll}>
                <Play className="size-4" /> Play
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setPlaylistOpen(true)}>
                <Plus className="size-4" /> Playlist
              </Button>
              <Button size="sm" variant="secondary" onClick={favoriteAll}>
                <Heart className="size-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={deleteAll}>
                <Trash2 className="size-4" />
              </Button>
              <Button size="iconSm" variant="ghost" onClick={clearSelection} aria-label="Clear selection">
                <X className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AddToPlaylistDialog open={playlistOpen} onOpenChange={setPlaylistOpen} songIds={selectedIds} />
    </>
  );
}
