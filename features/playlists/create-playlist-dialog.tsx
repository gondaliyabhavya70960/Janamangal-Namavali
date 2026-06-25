"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlaylist } from "@/services/playlists";

export function CreatePlaylistDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = async () => {
    const playlist = await createPlaylist(name, Date.now());
    if (description.trim()) {
      const { updatePlaylist } = await import("@/services/playlists");
      await updatePlaylist(playlist.id, { description: description.trim() }, Date.now());
    }
    toast.success(`Created “${playlist.name}”`);
    setOpen(false);
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New playlist</DialogTitle>
          <DialogDescription>Group tracks for a song, a set, or a practice routine.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pl-name">Name</Label>
            <Input
              id="pl-name"
              autoFocus
              placeholder="Warm-ups"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && submit()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-desc">Description (optional)</Label>
            <Input
              id="pl-desc"
              placeholder="Daily scales and exercises"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            Create playlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
