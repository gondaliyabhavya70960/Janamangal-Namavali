"use client";

import Link from "next/link";
import { Heart, ListMusic, Music2, Repeat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SongList } from "@/features/library/song-list";
import { useAllLoops, usePlaylists, useSongs } from "@/hooks/use-data";
import { usePlayerStore } from "@/store/player";
import { formatTimecodePrecise, pluralize } from "@/lib/utils";

export function FavoritesView() {
  const songs = useSongs();
  const loops = useAllLoops();
  const playlists = usePlaylists();
  const playSong = usePlayerStore((s) => s.playSong);
  const setLoopRegion = usePlayerStore((s) => s.setLoopRegion);

  const favSongs = songs.filter((s) => s.favorite);
  const favLoops = loops.filter((l) => l.favorite);
  const favPlaylists = playlists.filter((p) => p.favorite && !p.smart);
  const songMap = new Map(songs.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <PageHeader title="Favorites" description="Your starred songs, loops and playlists." />

      <Tabs defaultValue="songs">
        <TabsList>
          <TabsTrigger value="songs">Songs ({favSongs.length})</TabsTrigger>
          <TabsTrigger value="loops">Loops ({favLoops.length})</TabsTrigger>
          <TabsTrigger value="playlists">Playlists ({favPlaylists.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="songs">
          {favSongs.length === 0 ? (
            <EmptyState icon={Music2} title="No favorite songs" description="Tap the heart on any track." />
          ) : (
            <SongList songs={favSongs} />
          )}
        </TabsContent>

        <TabsContent value="loops">
          {favLoops.length === 0 ? (
            <EmptyState icon={Repeat} title="No favorite loops" description="Star a loop preset to find it here." />
          ) : (
            <div className="space-y-1.5">
              {favLoops.map((loop) => {
                const song = songMap.get(loop.songId);
                return (
                  <Card
                    key={loop.id}
                    interactive
                    className="flex cursor-pointer items-center gap-3 p-3"
                    onClick={async () => {
                      if (!song) return;
                      await playSong(song, [song]);
                      setLoopRegion(loop.start, loop.end, loop.id);
                    }}
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                      <Repeat className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{loop.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {song?.title ?? "Unknown"} · {formatTimecodePrecise(loop.start)} →{" "}
                        {formatTimecodePrecise(loop.end)}
                      </p>
                    </div>
                    <Heart className="size-4 fill-primary text-primary" />
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="playlists">
          {favPlaylists.length === 0 ? (
            <EmptyState icon={ListMusic} title="No favorite playlists" />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {favPlaylists.map((playlist) => (
                <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                  <Card interactive className="flex h-full flex-col gap-3 p-4">
                    <div
                      className="grid aspect-square w-full place-items-center rounded-xl text-white/90"
                      style={{ background: `linear-gradient(140deg, ${playlist.color}, hsl(240 10% 12%))` }}
                    >
                      <ListMusic className="size-8" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{playlist.name}</p>
                      <p className="text-xs text-muted-foreground">{pluralize(playlist.songIds.length, "track")}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
