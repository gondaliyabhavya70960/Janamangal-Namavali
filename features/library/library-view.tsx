"use client";

import { useMemo, useState } from "react";
import { Library, Link2, Play, Search, Shuffle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadButton, UploadDropzone } from "./upload-dropzone";
import { UrlImportDialog } from "./url-import-dialog";
import { SongList } from "./song-list";
import { SelectionBar } from "./selection-bar";
import { useSongs } from "@/hooks/use-data";
import { usePlayerStore } from "@/store/player";
import { createSongSearcher, searchSongs } from "@/services/search";
import { pluralize } from "@/lib/utils";
import type { Song } from "@/types";

type SortKey = "recent" | "title" | "plays" | "practice" | "duration";

const SORTS: Record<SortKey, (a: Song, b: Song) => number> = {
  recent: (a, b) => b.createdAt - a.createdAt,
  title: (a, b) => a.title.localeCompare(b.title),
  plays: (a, b) => b.playCount - a.playCount,
  practice: (a, b) => b.totalPracticeMs - a.totalPracticeMs,
  duration: (a, b) => b.duration - a.duration,
};

export function LibraryView() {
  const songs = useSongs();
  const loadQueue = usePlayerStore((s) => s.loadQueue);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const fuse = useMemo(() => createSongSearcher(songs), [songs]);

  const visible = useMemo(() => {
    const base = query.trim() ? searchSongs(fuse, query, songs) : songs;
    const sorted = [...base].sort(SORTS[sort]);
    if (!query.trim()) sorted.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return sorted;
  }, [songs, query, sort, fuse]);

  const playAll = () => {
    if (visible.length) void loadQueue(visible, 0, true);
  };

  const shufflePlay = () => {
    if (!visible.length) return;
    toggleShuffle();
    void loadQueue(visible, 0, true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description={songs.length ? pluralize(songs.length, "track") : "Build your practice collection"}
        actions={
          <>
            <UrlImportDialog>
              <Button variant="outline">
                <Link2 className="size-4" /> URL
              </Button>
            </UrlImportDialog>
            <UploadButton />
          </>
        }
      />

      {songs.length === 0 ? (
        <UploadDropzone />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search songs, artists, files…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently added</SelectItem>
                <SelectItem value="title">Title A–Z</SelectItem>
                <SelectItem value="plays">Most played</SelectItem>
                <SelectItem value="practice">Most practiced</SelectItem>
                <SelectItem value="duration">Longest</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={playAll} disabled={!visible.length}>
                <Play className="size-4 fill-current" /> Play
              </Button>
              <Button variant="secondary" size="icon" onClick={shufflePlay} aria-label="Shuffle play">
                <Shuffle className="size-4" />
              </Button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No tracks match “{query}”.
            </p>
          ) : (
            <SongList songs={visible} />
          )}
        </>
      )}

      <SelectionBar songs={songs} />
    </div>
  );
}
