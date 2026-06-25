"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { addSongsFromFiles } from "@/services/songs";
import { ACCEPTED_AUDIO_EXTENSIONS } from "@/lib/constants";
import type { Song } from "@/types";

function isAcceptedAudio(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  const lower = file.name.toLowerCase();
  return ACCEPTED_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const uploadFiles = useCallback(async (files: FileList | File[]): Promise<Song[]> => {
    const accepted = Array.from(files).filter(isAcceptedAudio);
    if (accepted.length === 0) {
      toast.error("No supported audio files found", {
        description: "Supported: mp3, wav, m4a, flac, ogg, aac, opus, webm.",
      });
      return [];
    }

    setUploading(true);
    setProgress({ done: 0, total: accepted.length });
    const toastId = toast.loading(`Importing 0/${accepted.length}…`);
    try {
      const songs = await addSongsFromFiles(accepted, Date.now(), (done, total) => {
        setProgress({ done, total });
        toast.loading(`Importing ${done}/${total}…`, { id: toastId });
      });
      toast.success(`Added ${songs.length} ${songs.length === 1 ? "track" : "tracks"} to your library`, {
        id: toastId,
      });
      return songs;
    } catch (error) {
      toast.error("Import failed", {
        id: toastId,
        description: error instanceof Error ? error.message : undefined,
      });
      return [];
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
    }
  }, []);

  return { uploading, progress, uploadFiles };
}
