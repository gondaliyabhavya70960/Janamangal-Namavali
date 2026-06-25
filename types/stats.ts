/** Derived analytics shapes consumed by the dashboard and statistics views. */

export interface TimeBucket {
  /** ISO day string `yyyy-MM-dd`. */
  date: string;
  label: string;
  ms: number;
  playCount: number;
}

export interface HeatmapCell {
  date: string;
  ms: number;
  /** Normalised intensity 0..4 for colour stepping. */
  level: 0 | 1 | 2 | 3 | 4;
}

export interface SongRank {
  songId: string;
  title: string;
  artist?: string;
  ms: number;
  playCount: number;
}

export interface StatsSummary {
  todayMs: number;
  weekMs: number;
  monthMs: number;
  yearMs: number;
  lifetimeMs: number;
  totalSessions: number;
  totalLoops: number;
  longestSessionMs: number;
  averageSessionMs: number;
  currentStreak: number;
  longestStreak: number;
  mostPlayed?: SongRank;
  topSongs: SongRank[];
  daily: TimeBucket[];
  weekly: TimeBucket[];
  monthly: TimeBucket[];
  heatmap: HeatmapCell[];
  speedUsage: Record<string, number>;
  loopUsageMs: number;
}
