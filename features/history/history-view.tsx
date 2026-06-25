"use client";

import { useMemo, useState } from "react";
import { Heart, History, Repeat, Search, Trash2, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ExportMenu } from "./export-menu";
import { useHistory } from "@/hooks/use-data";
import { deleteHistoryEntry, toggleHistoryFavorite } from "@/services/history";
import { dateLabel, timeLabel } from "@/lib/date";
import { cn, formatDurationMs, pluralize } from "@/lib/utils";

type Filter = "all" | "favorites" | "offline";

export function HistoryView() {
  const history = useHistory();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((entry) => {
      if (filter === "favorites" && !entry.favorite) return false;
      if (filter === "offline" && entry.online) return false;
      if (!q) return true;
      return (
        entry.songTitle.toLowerCase().includes(q) ||
        entry.songArtist?.toLowerCase().includes(q) ||
        entry.loopName?.toLowerCase().includes(q)
      );
    });
  }, [history, query, filter]);

  const totalMs = filtered.reduce((t, e) => t + e.playedMs, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description={`${pluralize(history.length, "session")} · ${formatDurationMs(totalMs)} listened`}
        actions={<ExportMenu entries={filtered} />}
      />

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          title="No practice history yet"
          description="Once you start playing, every session is logged here with duration, speed and loops."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search history…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5">
              {(["all", "favorites", "offline"] as Filter[]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? "default" : "secondary"}
                  className="capitalize"
                  onClick={() => setFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          <Card className="divide-y divide-border/60 overflow-hidden">
            {/* Header (desktop) */}
            <div className="hidden grid-cols-[1.6fr_1fr_0.7fr_0.6fr_0.9fr_auto] gap-3 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid">
              <span>Song</span>
              <span>When</span>
              <span>Duration</span>
              <span>Speed</span>
              <span>Loop</span>
              <span className="w-16 text-right">Actions</span>
            </div>

            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-1 gap-1 px-4 py-3 transition-colors hover:bg-accent/40 lg:grid-cols-[1.6fr_1fr_0.7fr_0.6fr_0.9fr_auto] lg:items-center lg:gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{entry.songTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">{entry.songArtist || "Unknown artist"}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="lg:hidden">When: </span>
                  {dateLabel(entry.startedAt)} · {timeLabel(entry.startedAt)}
                </div>
                <div className="text-sm tabular-nums">{formatDurationMs(entry.playedMs)}</div>
                <div className="text-sm tabular-nums">{entry.speed}×</div>
                <div className="flex items-center gap-1.5 text-xs">
                  {entry.loopName ? (
                    <Badge variant="muted" className="gap-1">
                      <Repeat className="size-3" /> {entry.loopCount}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {!entry.online && <WifiOff className="size-3.5 text-muted-foreground" />}
                </div>
                <div className="flex items-center justify-end gap-0.5">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => toggleHistoryFavorite(entry.id)}
                    aria-label="Favorite"
                  >
                    <Heart className={cn("size-4", entry.favorite && "fill-primary text-primary")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => deleteHistoryEntry(entry.id)}
                    aria-label="Delete entry"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
