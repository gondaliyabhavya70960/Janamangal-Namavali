"use client";

import {
  Activity,
  BarChart3,
  Flame,
  Gauge,
  Hourglass,
  Repeat,
  Timer,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { SongCover } from "@/components/shared/song-cover";
import { AreaTrendChart, SpeedDoughnut, TrendBarChart } from "./charts";
import { PracticeHeatmap } from "./heatmap";
import { useSongs, useStats } from "@/hooks/use-data";
import { usePlayerStore } from "@/store/player";
import { formatDurationMs, pluralize } from "@/lib/utils";

export function StatsView() {
  const stats = useStats();
  const songs = useSongs();
  const playSong = usePlayerStore((s) => s.playSong);

  if (!stats) {
    return <p className="py-20 text-center text-muted-foreground">Crunching your numbers…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Statistics" description="Every minute of practice, visualised." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Flame} label="Current streak" value={pluralize(stats.currentStreak, "day")} accent />
        <StatTile icon={Trophy} label="Longest streak" value={pluralize(stats.longestStreak, "day")} />
        <StatTile icon={Activity} label="Sessions" value={stats.totalSessions} />
        <StatTile icon={Repeat} label="Loops" value={stats.totalLoops} />
        <StatTile icon={Timer} label="Longest session" value={formatDurationMs(stats.longestSessionMs)} />
        <StatTile icon={Hourglass} label="Avg session" value={formatDurationMs(stats.averageSessionMs)} />
        <StatTile icon={Gauge} label="Loop practice" value={formatDurationMs(stats.loopUsageMs)} />
        <StatTile icon={BarChart3} label="This year" value={formatDurationMs(stats.yearMs)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-primary" /> Listening time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              <AreaTrendChart buckets={stats.daily} />
            </TabsContent>
            <TabsContent value="weekly">
              <TrendBarChart buckets={stats.weekly} />
            </TabsContent>
            <TabsContent value="monthly">
              <TrendBarChart buckets={stats.monthly} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" /> Practice heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PracticeHeatmap cells={stats.heatmap} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4 text-primary" /> Speed usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpeedDoughnut usage={stats.speedUsage} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4 text-primary" /> Top tracks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topSongs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No practice recorded yet.</p>
          ) : (
            <div className="space-y-1">
              {stats.topSongs.map((rank, i) => {
                const song = songs.find((s) => s.id === rank.songId);
                return (
                  <button
                    key={rank.songId}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent"
                    onClick={() => song && void playSong(song, songs)}
                  >
                    <span className="w-5 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <SongCover song={song ?? { color: undefined, title: rank.title }} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{rank.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {rank.artist || "Unknown artist"} · {pluralize(rank.playCount, "play")}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{formatDurationMs(rank.ms)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
