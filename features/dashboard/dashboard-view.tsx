"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Download,
  Flame,
  History,
  Music2,
  Play,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/shared/stat-tile";
import { SparkBars } from "@/components/shared/spark-bars";
import { SongCover } from "@/components/shared/song-cover";
import { EmptyState } from "@/components/shared/empty-state";
import { useStats } from "@/hooks/use-data";
import { useSongs } from "@/hooks/use-data";
import { useSettingsStore } from "@/store/settings";
import { usePlayerStore } from "@/store/player";
import { usePwaInstall } from "@/hooks/use-pwa";
import { cn, formatDurationMs, pluralize } from "@/lib/utils";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Late night practice";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function GoalRing({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.round(value * 100));
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid size-20 place-items-center rounded-full"
        style={{
          background: `conic-gradient(hsl(var(--primary)) ${pct * 3.6}deg, hsl(var(--muted)) 0deg)`,
        }}
      >
        <div className="grid size-15 place-items-center rounded-full bg-card">
          <span className="text-lg font-bold tabular-nums">{pct}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}

export function DashboardView() {
  const stats = useStats();
  const songs = useSongs();
  const dailyGoal = useSettingsStore((s) => s.settings.dailyGoalMinutes);
  const loadQueue = usePlayerStore((s) => s.loadQueue);
  const playSong = usePlayerStore((s) => s.playSong);
  const { canInstall, promptInstall } = usePwaInstall();

  const recent = [...songs]
    .filter((s) => s.lastPlayedAt)
    .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0))
    .slice(0, 5);

  const goalProgress = stats ? stats.todayMs / Math.max(1, dailyGoal * 60000) : 0;
  const mostPlayedSong = songs.find((s) => s.id === stats?.mostPlayed?.songId);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="app-aurora relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{greeting()}</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to <span className="text-gradient">riyaz</span>?
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="default" className="gap-1">
                <Flame className="size-3.5" /> {pluralize(stats?.currentStreak ?? 0, "day")} streak
              </Badge>
              <Badge variant="muted">{formatDurationMs(stats?.todayMs ?? 0)} today</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {canInstall && (
              <Button variant="outline" onClick={() => void promptInstall()}>
                <Download className="size-4" /> Install app
              </Button>
            )}
            {songs.length > 0 && (
              <Button onClick={() => void loadQueue(songs, 0, true)}>
                <Play className="size-4 fill-current" /> Practice now
              </Button>
            )}
          </div>
        </div>
      </div>

      {songs.length === 0 ? (
        <EmptyState
          icon={Music2}
          title="Your studio is empty"
          description="Upload your first track to start tracking practice time, looping passages and slowing things down."
          action={
            <Button asChild>
              <Link href="/library">
                Go to Library <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile icon={Clock} label="Today" value={formatDurationMs(stats?.todayMs ?? 0)} accent />
            <StatTile icon={CalendarDays} label="This week" value={formatDurationMs(stats?.weekMs ?? 0)} />
            <StatTile icon={TrendingUp} label="This month" value={formatDurationMs(stats?.monthMs ?? 0)} />
            <StatTile icon={Trophy} label="Lifetime" value={formatDurationMs(stats?.lifetimeMs ?? 0)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Goal + trend */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" /> Practice trend
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/stats">
                    Details <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <SparkBars buckets={stats?.daily ?? []} height={96} />
                <p className="text-xs text-muted-foreground">Last 14 days of actual listening time.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="size-4 text-primary" /> Daily goal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <GoalRing value={goalProgress} label={`${dailyGoal} min target`} />
                <p className="text-sm text-muted-foreground">
                  {goalProgress >= 1
                    ? "Goal smashed for today. 🎉"
                    : `${formatDurationMs(Math.max(0, dailyGoal * 60000 - (stats?.todayMs ?? 0)))} to go.`}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Most played */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-4 text-primary" /> Most played
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mostPlayedSong ? (
                  <button
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent"
                    onClick={() => void playSong(mostPlayedSong, songs)}
                  >
                    <SongCover song={mostPlayedSong} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{mostPlayedSong.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {pluralize(mostPlayedSong.playCount, "play")} ·{" "}
                        {formatDurationMs(mostPlayedSong.totalPracticeMs)}
                      </p>
                    </div>
                    <Play className="size-4 text-primary" />
                  </button>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">Play something to see it here.</p>
                )}
              </CardContent>
            </Card>

            {/* Recently played */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="size-4 text-primary" /> Recently played
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/history">
                    All history <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nothing played yet.</p>
                ) : (
                  <div className="space-y-1">
                    {recent.map((song) => (
                      <button
                        key={song.id}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent",
                        )}
                        onClick={() => void playSong(song, songs)}
                      >
                        <SongCover song={song} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{song.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{song.artist || "Unknown artist"}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDurationMs(song.totalPracticeMs)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
