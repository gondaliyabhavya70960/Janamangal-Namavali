import type { AppSettings, AudioFormat, SmartPlaylistKind } from "@/types";

export const APP_NAME = "Riyaz";
export const APP_TAGLINE = "Practice, perfected.";
export const APP_DESCRIPTION =
  "An offline-first music practice studio with precise time tracking, looping, speed control and analytics.";

/** Accent colour presets. The value is an HSL triple assigned to `--primary`. */
export interface AccentPreset {
  key: string;
  name: string;
  primary: string;
  ring: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { key: "violet", name: "Violet", primary: "262 83% 64%", ring: "262 83% 64%" },
  { key: "indigo", name: "Indigo", primary: "243 75% 66%", ring: "243 75% 66%" },
  { key: "blue", name: "Azure", primary: "212 95% 62%", ring: "212 95% 62%" },
  { key: "cyan", name: "Cyan", primary: "189 94% 52%", ring: "189 94% 52%" },
  { key: "emerald", name: "Emerald", primary: "158 70% 50%", ring: "158 70% 50%" },
  { key: "amber", name: "Amber", primary: "38 95% 58%", ring: "38 95% 58%" },
  { key: "rose", name: "Rose", primary: "346 84% 62%", ring: "346 84% 62%" },
  { key: "fuchsia", name: "Fuchsia", primary: "292 84% 64%", ring: "292 84% 64%" },
];

export const DEFAULT_ACCENT = "violet";

export function getAccent(key: string): AccentPreset {
  return ACCENT_PRESETS.find((preset) => preset.key === key) ?? ACCENT_PRESETS[0];
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: "app",
  theme: "dark",
  accent: DEFAULT_ACCENT,
  defaultSpeed: 1,
  defaultVolume: 0.9,
  preservePitch: true,
  autoResume: true,
  showWaveform: true,
  crossfadeSeconds: 0,
  sleepTimerDefaultMinutes: 30,
  dailyGoalMinutes: 30,
  breakReminderMinutes: 45,
  notificationsEnabled: false,
  keyboardShortcutsEnabled: true,
  reduceMotion: false,
  backupReminderDays: 7,
};

/** MIME → format and the set of accepted upload extensions. */
export const ACCEPTED_AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".flac",
  ".ogg",
  ".aac",
  ".opus",
  ".webm",
] as const;

export const ACCEPTED_AUDIO_MIME = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/flac",
  "audio/x-flac",
  "audio/ogg",
  "audio/opus",
  "audio/webm",
].join(",");

export function formatFromFile(name: string, mime: string): AudioFormat {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const byExt: Record<string, AudioFormat> = {
    mp3: "mp3",
    wav: "wav",
    m4a: "m4a",
    flac: "flac",
    ogg: "ogg",
    aac: "aac",
    opus: "opus",
    webm: "webm",
  };
  if (byExt[ext]) return byExt[ext];
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("flac")) return "flac";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("aac")) return "aac";
  if (mime.includes("opus")) return "opus";
  return "mp3";
}

export interface SmartPlaylistDef {
  kind: SmartPlaylistKind;
  name: string;
  description: string;
}

export const SMART_PLAYLISTS: SmartPlaylistDef[] = [
  { kind: "most-played", name: "Most Played", description: "Your most-practised tracks" },
  { kind: "recently-played", name: "Recently Played", description: "Picked up where you left off" },
  { kind: "recently-added", name: "Recently Added", description: "Freshly imported to your library" },
  { kind: "longest-practice", name: "Longest Practice", description: "Tracks you grind the hardest" },
  { kind: "favorites", name: "Favorites", description: "Everything you've starred" },
  { kind: "downloaded", name: "Downloaded", description: "Available fully offline" },
];

export interface ShortcutDef {
  id: string;
  keys: string[];
  label: string;
  category: "Playback" | "Looping" | "Navigation" | "Library" | "General";
}

/** Single source of truth for keyboard shortcuts, surfaced in the help dialog. */
export const SHORTCUTS: ShortcutDef[] = [
  { id: "play-pause", keys: ["Space"], label: "Play / Pause", category: "Playback" },
  { id: "next", keys: ["⇧", "N"], label: "Next track", category: "Playback" },
  { id: "prev", keys: ["⇧", "P"], label: "Previous track", category: "Playback" },
  { id: "seek-back", keys: ["←"], label: "Seek back 5s", category: "Playback" },
  { id: "seek-forward", keys: ["→"], label: "Seek forward 5s", category: "Playback" },
  { id: "vol-up", keys: ["↑"], label: "Volume up", category: "Playback" },
  { id: "vol-down", keys: ["↓"], label: "Volume down", category: "Playback" },
  { id: "mute", keys: ["M"], label: "Mute / Unmute", category: "Playback" },
  { id: "speed-down", keys: ["-"], label: "Slow down", category: "Playback" },
  { id: "speed-up", keys: ["="], label: "Speed up", category: "Playback" },
  { id: "speed-reset", keys: ["0"], label: "Reset speed to 1×", category: "Playback" },
  { id: "loop-start", keys: ["["], label: "Set loop start", category: "Looping" },
  { id: "loop-end", keys: ["]"], label: "Set loop end", category: "Looping" },
  { id: "loop-toggle", keys: ["L"], label: "Toggle loop", category: "Looping" },
  { id: "loop-clear", keys: ["\\"], label: "Clear loop", category: "Looping" },
  { id: "shuffle", keys: ["S"], label: "Toggle shuffle", category: "Playback" },
  { id: "repeat", keys: ["R"], label: "Cycle repeat mode", category: "Playback" },
  { id: "favorite", keys: ["F"], label: "Favorite current song", category: "Library" },
  { id: "command", keys: ["⌘", "K"], label: "Open command palette", category: "General" },
  { id: "search", keys: ["/"], label: "Focus search", category: "Navigation" },
  { id: "shortcuts", keys: ["?"], label: "Show shortcuts", category: "General" },
];

export const SLEEP_TIMER_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90] as const;

export const SEEK_STEP_SECONDS = 5;
export const VOLUME_STEP = 0.05;

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/library", label: "Library", icon: "Library" },
  { href: "/playlists", label: "Playlists", icon: "ListMusic" },
  { href: "/favorites", label: "Favorites", icon: "Heart" },
  { href: "/history", label: "History", icon: "History" },
  { href: "/stats", label: "Statistics", icon: "BarChart3" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;
