import { db } from "@/db/database";
import { getAudioDuration } from "@/lib/audio/decode";
import { createId } from "@/lib/id";
import { colorFromString } from "@/lib/utils";
import type { Song } from "@/types";

/**
 * Seeds a bundled demo track into the on-device library on first run, so the
 * app has real, playable data to display immediately. The audio ships in
 * `public/demo/` and is copied into IndexedDB like any uploaded song — the user
 * can favorite, loop or delete it. Seeds once (guarded by a localStorage flag)
 * and never into a library that already has songs.
 */
const DEMO_FLAG = "riyaz:demo-seeded:v1";
const DEMO_PATH = "/demo/janmangal-namavali.mp3";
const DEMO_TITLE = "Janmangal Namavali";

export async function seedDemoSongIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(DEMO_FLAG)) return;

    // Never seed into a library the user has already populated.
    if ((await db.songs.count()) > 0) {
      localStorage.setItem(DEMO_FLAG, "1");
      return;
    }

    const response = await fetch(DEMO_PATH);
    if (!response.ok) return; // try again next launch (e.g. asset not cached offline yet)
    const blob = await response.blob();
    const duration = await getAudioDuration(blob);
    const now = Date.now();
    const id = createId("song");

    const song: Song = {
      id,
      title: DEMO_TITLE,
      artist: "Demo track",
      fileName: "janmangal-namavali.mp3",
      mimeType: blob.type || "audio/mpeg",
      format: "mp3",
      size: blob.size,
      duration,
      sourceType: "local",
      color: colorFromString(DEMO_TITLE),
      tags: ["demo"],
      favorite: false,
      pinned: false,
      playCount: 0,
      totalPracticeMs: 0,
      loopCountTotal: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.transaction("rw", db.songs, db.blobs, async () => {
      await db.songs.put(song);
      await db.blobs.put({ songId: id, audio: blob });
    });
    localStorage.setItem(DEMO_FLAG, "1");
  } catch {
    // Best-effort: seeding the demo must never break app startup.
  }
}
