"use client";

import Link from "next/link";
import {
  Clock,
  Download,
  Heart,
  ListMusic,
  Plus,
  Sparkles,
  Star,
  Timer,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CreatePlaylistDialog } from "./create-playlist-dialog";
import { usePlaylists } from "@/hooks/use-data";
import { SMART_PLAYLISTS } from "@/lib/constants";
import { pluralize } from "@/lib/utils";
import type { SmartPlaylistKind } from "@/types";

const SMART_ICON: Record<SmartPlaylistKind, LucideIcon> = {
  "most-played": TrendingUp,
  "recently-played": Clock,
  "recently-added": Sparkles,
  "longest-practice": Timer,
  favorites: Star,
  downloaded: Download,
};

export function PlaylistsView() {
  const playlists = usePlaylists().filter((p) => !p.smart);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playlists"
        description="Curated sets and smart collections"
        actions={
          <CreatePlaylistDialog>
            <Button>
              <Plus className="size-4" /> New playlist
            </Button>
          </CreatePlaylistDialog>
        }
      />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Sparkles className="size-4" /> Smart playlists
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {SMART_PLAYLISTS.map((smart) => {
            const Icon = SMART_ICON[smart.kind];
            return (
              <Link key={smart.kind} href={`/playlists/smart-${smart.kind}`}>
                <Card interactive className="flex h-full items-center gap-3 p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{smart.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{smart.description}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ListMusic className="size-4" /> Your playlists
        </h2>
        {playlists.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="No playlists yet"
            description="Create a playlist to organise warm-ups, set lists or pieces you're learning."
            action={
              <CreatePlaylistDialog>
                <Button>
                  <Plus className="size-4" /> New playlist
                </Button>
              </CreatePlaylistDialog>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                <Card interactive className="flex h-full flex-col gap-3 p-4">
                  <div
                    className="grid aspect-square w-full place-items-center rounded-xl text-white/90"
                    style={{ background: `linear-gradient(140deg, ${playlist.color}, hsl(240 10% 12%))` }}
                  >
                    <ListMusic className="size-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="truncate font-medium">{playlist.name}</p>
                      {playlist.favorite && <Heart className="size-3.5 shrink-0 fill-primary text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{pluralize(playlist.songIds.length, "track")}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
