import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  DailyStat,
  Goal,
  HistoryEntry,
  LoopPreset,
  Playlist,
  PracticeSession,
  Song,
  SongBlob,
} from "@/types";

/**
 * The single IndexedDB database for the whole app. Schema versions are additive —
 * bump `version()` and provide an upgrade function rather than editing an
 * existing version so that returning users keep their data.
 *
 * Index strings: the first token is the primary key; `*field` denotes a
 * multi-entry index; subsequent tokens are secondary indexes used by queries.
 */
export class RiyazDatabase extends Dexie {
  songs!: Table<Song, string>;
  blobs!: Table<SongBlob, string>;
  playlists!: Table<Playlist, string>;
  loops!: Table<LoopPreset, string>;
  history!: Table<HistoryEntry, string>;
  sessions!: Table<PracticeSession, string>;
  dailyStats!: Table<DailyStat, string>;
  goals!: Table<Goal, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("riyaz");
    this.version(1).stores({
      songs:
        "id, title, artist, album, favorite, pinned, playCount, totalPracticeMs, lastPlayedAt, createdAt, updatedAt, *tags",
      blobs: "songId",
      playlists: "id, name, favorite, smart, pinnedAt, updatedAt",
      loops: "id, songId, favorite, playCount, updatedAt",
      history: "id, songId, date, startedAt, endedAt, favorite, speed",
      sessions: "id, startedAt, endedAt, favorite",
      dailyStats: "date",
      goals: "id, kind, active",
      settings: "id",
    });
  }
}

/**
 * Lazily-constructed singleton. We avoid touching IndexedDB during server
 * rendering — the instance is only created in the browser. Components access
 * data through repositories and `useLiveQuery`, both of which run client-side.
 */
let _db: RiyazDatabase | null = null;

export function getDb(): RiyazDatabase {
  if (typeof window === "undefined") {
    // Returned object is never queried on the server; this keeps imports safe.
    throw new Error("RiyazDatabase is only available in the browser.");
  }
  if (!_db) _db = new RiyazDatabase();
  return _db;
}

/**
 * Browser-safe accessor used by `useLiveQuery` callbacks. During SSR the hook
 * never invokes its querier, so returning a lazy proxy here is sufficient.
 */
export const db: RiyazDatabase =
  typeof window === "undefined"
    ? (new Proxy(
        {},
        {
          get() {
            throw new Error("RiyazDatabase accessed during SSR");
          },
        },
      ) as RiyazDatabase)
    : getDb();
