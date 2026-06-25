import { db } from "@/db/database";
import { createId } from "@/lib/id";
import type { PracticeSession } from "@/types";

export async function startSession(now: number): Promise<PracticeSession> {
  const session: PracticeSession = {
    id: createId("ses"),
    startedAt: now,
    playedMs: 0,
    songIds: [],
    loopCount: 0,
    favorite: false,
  };
  await db.sessions.put(session);
  return session;
}

export async function touchSession(
  id: string,
  patch: { addMs?: number; songId?: string; addLoops?: number; endedAt?: number },
): Promise<void> {
  const session = await db.sessions.get(id);
  if (!session) return;
  const songIds = session.songIds.slice();
  if (patch.songId && !songIds.includes(patch.songId)) songIds.push(patch.songId);
  await db.sessions.update(id, {
    playedMs: session.playedMs + (patch.addMs ?? 0),
    loopCount: session.loopCount + (patch.addLoops ?? 0),
    songIds,
    endedAt: patch.endedAt ?? session.endedAt,
  });
}

export function listSessions(): Promise<PracticeSession[]> {
  return db.sessions.orderBy("startedAt").reverse().toArray();
}

export async function toggleSessionFavorite(id: string): Promise<void> {
  const session = await db.sessions.get(id);
  if (session) await db.sessions.update(id, { favorite: !session.favorite });
}
