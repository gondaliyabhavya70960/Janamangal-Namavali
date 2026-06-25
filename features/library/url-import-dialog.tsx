"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link2, Loader2 } from "lucide-react";
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
import { addSongFromUrl } from "@/services/songs";

export function UrlImportDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const mutation = useMutation({
    mutationFn: () => addSongFromUrl(url.trim(), Date.now(), title),
    onSuccess: (song) => {
      toast.success(`Imported “${song.title}”`);
      setOpen(false);
      setUrl("");
      setTitle("");
    },
    onError: (error) => toast.error("Could not import", { description: (error as Error).message }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-5 text-primary" /> Import from URL
          </DialogTitle>
          <DialogDescription>
            Paste a direct link to an audio file. It is downloaded once and stored offline on your device.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="import-url">Audio URL</Label>
            <Input
              id="import-url"
              placeholder="https://example.com/track.mp3"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="import-title">Title (optional)</Label>
            <Input
              id="import-title"
              placeholder="Auto-detected from the file name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!url.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Import track
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
