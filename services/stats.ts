import {
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { db } from "@/db/database";
import { monthDayLabel, monthKeys, shortDayLabel, toDayKey, weekKeys } from "@/lib/date";
import type {
  DailyStat,
  HeatmapCell,
  HistoryEntry,
  SongRank,
  StatsSummary,
  TimeBucket,
} from "@/types";

function sumKeys(map: Map<string, DailyStat>, keys: string[]): number {
  return keys.reduce((total, key) => total + (map.get(key)?.totalMs ?? 0), 0);
}

function computeStreaks(activeDays: Set<string>, now: number): { current: number; longest: number } {
  // Current streak: count back from today (with a one-day grace for "not yet today").
  let current = 0;
  let cursor = new Date(now);
  if (!activeDays.has(toDayKey(cursor))) cursor = subDays(cursor, 1);
  while (activeDays.has(toDayKey(cursor))) {
    current += 1;
    cursor = subDays(cursor, 1);
  }

  // Longest streak: scan sorted unique active days for the longest run.
  const sorted = Array.from(activeDays).sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const date = parseISO(key);
    if (prev && Math.round((date.getTime() - prev.getTime()) / 86400000) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = date;
  }
  return { current, longest: Math.max(longest, current) };
}

export async function computeStatsSummary(now: number): Promise<StatsSummary> {
  const [dailyStats, songs, sessions, history] = await Promise.all([
    db.dailyStats.toArray(),
    db.songs.toArray(),
    db.sessions.toArray(),
    db.history.toArray(),
  ]);

  const statMap = new Map(dailyStats.map((s) => [s.date, s]));
  const todayKeyValue = toDayKey(now);

  // Daily buckets — last 14 days.
  const dailyDays = eachDayOfInterval({ start: subDays(now, 13), end: new Date(now) });
  const daily: TimeBucket[] = dailyDays.map((d) => {
    const key = toDayKey(d);
    const stat = statMap.get(key);
    return { date: key, label: shortDayLabel(key), ms: stat?.totalMs ?? 0, playCount: stat?.playCount ?? 0 };
  });

  // Weekly buckets — last 12 weeks.
  const weekly: TimeBucket[] = Array.from({ length: 12 }, (_, i) => {
    const ref = subWeeks(now, 11 - i);
    const start = startOfWeek(ref, { weekStartsOn: 1 });
    const end = endOfWeek(ref, { weekStartsOn: 1 });
    const keys = eachDayOfInterval({ start, end }).map((d) => toDayKey(d));
    const ms = sumKeys(statMap, keys);
    const playCount = keys.reduce((t, k) => t + (statMap.get(k)?.playCount ?? 0), 0);
    return { date: toDayKey(start), label: format(start, "MMM d"), ms, playCount };
  });

  // Monthly buckets — last 12 months.
  const monthly: TimeBucket[] = Array.from({ length: 12 }, (_, i) => {
    const ref = subMonths(now, 11 - i);
    const start = startOfMonth(ref);
    const keys = dailyStats
      .filter((s) => {
        const d = parseISO(s.date);
        return d.getFullYear() === start.getFullYear() && d.getMonth() === start.getMonth();
      })
      .map((s) => s.date);
    const ms = sumKeys(statMap, keys);
    const playCount = keys.reduce((t, k) => t + (statMap.get(k)?.playCount ?? 0), 0);
    return { date: toDayKey(start), label: format(start, "MMM"), ms, playCount };
  });

  // Heatmap — last 26 weeks (182 days).
  const heatmapDays = eachDayOfInterval({ start: subDays(now, 181), end: new Date(now) });
  const heatMax = Math.max(1, ...heatmapDays.map((d) => statMap.get(toDayKey(d))?.totalMs ?? 0));
  const heatmap: HeatmapCell[] = heatmapDays.map((d) => {
    const key = toDayKey(d);
    const ms = statMap.get(key)?.totalMs ?? 0;
    const level = (ms === 0 ? 0 : Math.min(4, Math.ceil((ms / heatMax) * 4))) as HeatmapCell["level"];
    return { date: key, ms, level };
  });

  // Song rankings by lifetime practice time.
  const topSongs: SongRank[] = songs
    .filter((s) => s.totalPracticeMs > 0 || s.playCount > 0)
    .sort((a, b) => b.totalPracticeMs - a.totalPracticeMs)
    .slice(0, 10)
    .map((s) => ({ songId: s.id, title: s.title, artist: s.artist, ms: s.totalPracticeMs, playCount: s.playCount }));
  const mostPlayed = [...songs].sort((a, b) => b.playCount - a.playCount)[0];

  // Session metrics.
  const sessionDurations = sessions.map((s) => s.playedMs).filter((ms) => ms > 0);
  const longestSessionMs = sessionDurations.length ? Math.max(...sessionDurations) : 0;
  const averageSessionMs = sessionDurations.length
    ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
    : 0;

  // Speed + loop usage from history.
  const speedUsage: Record<string, number> = {};
  let loopUsageMs = 0;
  for (const entry of history as HistoryEntry[]) {
    const key = `${entry.speed}x`;
    speedUsage[key] = (speedUsage[key] ?? 0) + entry.playedMs;
    if (entry.loopId) loopUsageMs += entry.playedMs;
  }

  const activeDays = new Set(dailyStats.filter((s) => s.totalMs > 0).map((s) => s.date));
  const { current, longest } = computeStreaks(activeDays, now);

  const lifetimeMs = dailyStats.reduce((t, s) => t + s.totalMs, 0);
  const yearKeys = dailyStats
    .filter((s) => parseISO(s.date).getFullYear() === new Date(now).getFullYear())
    .map((s) => s.date);

  return {
    todayMs: statMap.get(todayKeyValue)?.totalMs ?? 0,
    weekMs: sumKeys(statMap, weekKeys(now)),
    monthMs: sumKeys(statMap, monthKeys(now)),
    yearMs: sumKeys(statMap, yearKeys),
    lifetimeMs,
    totalSessions: sessions.length,
    totalLoops: dailyStats.reduce((t, s) => t + s.loopCount, 0),
    longestSessionMs,
    averageSessionMs,
    currentStreak: current,
    longestStreak: longest,
    mostPlayed: mostPlayed
      ? {
          songId: mostPlayed.id,
          title: mostPlayed.title,
          artist: mostPlayed.artist,
          ms: mostPlayed.totalPracticeMs,
          playCount: mostPlayed.playCount,
        }
      : undefined,
    topSongs,
    daily,
    weekly,
    monthly,
    heatmap,
    speedUsage,
    loopUsageMs,
  };
}

export { monthDayLabel };
