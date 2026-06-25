/**
 * Persisted domain entities. Everything in this file maps 1:1 to a Dexie table.
 *
 * Design notes:
 * - Audio binary data lives in a dedicated `blobs` table keyed by song id so that
 *   listing the library never has to deserialize megabytes of audio.
 * - Timestamps are epoch milliseconds (numbers) so they are index-friendly.
 * - `date` fields are ISO day strings (`yyyy-MM-dd`) for fast day-bucketed queries.
 */

export type AudioFormat = "mp3" | "wav" | "m4a" | "flac" | "ogg" | "aac" | "webm" | "opus";

export type SourceType = "local" | "url";

/** Lightweight, list-friendly song metadata. Audio bytes live in {@link SongBlob}. */
export interface Song {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  fileName: string;
  mimeType: string;
  format: AudioFormat;
  /** Size of the audio payload in bytes. */
  size: number;
  /** Duration in seconds. May be 0 until metadata has been decoded. */
  duration: number;
  sourceType: SourceType;
  /** Original remote URL when imported from the web. */
  sourceUrl?: string;
  /** Down-sampled waveform peaks (0..1) for instant rendering without decoding. */
  peaks?: number[];
  /** Optional colour extracted/assigned for cover gradients. */
  color?: string;
  tags?: string[];
  bpm?: number;
  notes?: string;
  favorite: boolean;
  pinned: boolean;
  playCount: number;
  /** Lifetime *actual listening* time for this song, in milliseconds. */
  totalPracticeMs: number;
  loopCountTotal: number;
  lastPlayedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/** Binary payloads kept out of the hot metadata table. */
export interface SongBlob {
  songId: string;
  audio: Blob;
  cover?: Blob;
}

export type SmartPlaylistKind =
  | "most-played"
  | "recently-played"
  | "recently-added"
  | "longest-practice"
  | "favorites"
  | "downloaded";

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  /** Ordered song ids. Empty for smart playlists (computed on read). */
  songIds: string[];
  color?: string;
  favorite: boolean;
  /** When set, the playlist is computed dynamically rather than hand-curated. */
  smart?: SmartPlaylistKind | null;
  pinnedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/** An A↔B loop region saved against a song. */
export interface LoopPreset {
  id: string;
  songId: string;
  name: string;
  /** Loop start/end in seconds. */
  start: number;
  end: number;
  color?: string;
  favorite: boolean;
  playCount: number;
  createdAt: number;
  updatedAt: number;
}

/** One contiguous listening record for a single song. The analytics source of truth. */
export interface HistoryEntry {
  id: string;
  songId: string;
  songTitle: string;
  songArtist?: string;
  /** ISO day string `yyyy-MM-dd` (local) — indexed for day/week/month rollups. */
  date: string;
  startedAt: number;
  endedAt: number;
  /** Actual listening time (only while playing), in milliseconds. */
  playedMs: number;
  /** Time the audio was paused during this record, in milliseconds. */
  pausedMs: number;
  speed: number;
  loopId?: string;
  loopName?: string;
  loopCount: number;
  deviceLabel: string;
  online: boolean;
  favorite: boolean;
  notes?: string;
}

/** A broader practice block that may span multiple songs. */
export interface PracticeSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  /** Total actual listening time across the session, in milliseconds. */
  playedMs: number;
  songIds: string[];
  loopCount: number;
  goalId?: string;
  notes?: string;
  favorite: boolean;
}

/** Pre-aggregated per-day rollup that powers the dashboard, streak and heatmap. */
export interface DailyStat {
  /** ISO day string `yyyy-MM-dd` (local). Primary key. */
  date: string;
  /** Actual listening time for the day, in milliseconds. */
  totalMs: number;
  playCount: number;
  sessionCount: number;
  loopCount: number;
  songIds: string[];
}

export type ThemeMode = "dark" | "light" | "system";

export interface AppSettings {
  id: "app";
  theme: ThemeMode;
  accent: string;
  defaultSpeed: number;
  defaultVolume: number;
  preservePitch: boolean;
  autoResume: boolean;
  showWaveform: boolean;
  crossfadeSeconds: number;
  sleepTimerDefaultMinutes: number;
  dailyGoalMinutes: number;
  breakReminderMinutes: number;
  notificationsEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  reduceMotion: boolean;
  backupReminderDays: number;
  lastBackupAt?: number;
  onboardedAt?: number;
}

export type GoalKind = "daily" | "weekly" | "monthly" | "streak";

export interface Goal {
  id: string;
  title: string;
  kind: GoalKind;
  /** Target in minutes (for time goals) or days (for streak goals). */
  target: number;
  active: boolean;
  achievedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/** Shape of a full data export / backup file. */
export interface BackupFile {
  app: "riyaz";
  version: number;
  exportedAt: number;
  /** Audio blobs are exported as base64 data URLs keyed by song id. */
  songs: Song[];
  audio: Record<string, string>;
  playlists: Playlist[];
  loops: LoopPreset[];
  history: HistoryEntry[];
  sessions: PracticeSession[];
  dailyStats: DailyStat[];
  goals: Goal[];
  settings: AppSettings | null;
}
