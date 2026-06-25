import { db } from "@/db/database";
import { createId } from "@/lib/id";
import { colorFromString } from "@/lib/utils";
import type { LoopPreset } from "@/types";

export function listLoopsForSong(songId: string): Promise<LoopPreset[]> {
  return db.loops.where("songId").equals(songId).reverse().sortBy("updatedAt");
}

export function listAllLoops(): Promise<LoopPreset[]> {
  return db.loops.orderBy("updatedAt").reverse().toArray();
}

export async function createLoop(input: {
  songId: string;
  name: string;
  start: number;
  end: number;
  now: number;
}): Promise<LoopPreset> {
  const loop: LoopPreset = {
    id: createId("loop"),
    songId: input.songId,
    name: input.name,
    start: input.start,
    end: input.end,
    color: colorFromString(input.name + input.songId),
    favorite: false,
    playCount: 0,
    createdAt: input.now,
    updatedAt: input.now,
  };
  await db.loops.put(loop);
  return loop;
}

export async function updateLoop(id: string, patch: Partial<LoopPreset>, now: number): Promise<void> {
  await db.loops.update(id, { ...patch, updatedAt: now });
}

export async function removeLoop(id: string): Promise<void> {
  await db.loops.delete(id);
}

export async function toggleLoopFavorite(id: string): Promise<void> {
  const loop = await db.loops.get(id);
  if (loop) await db.loops.update(id, { favorite: !loop.favorite });
}

export async function incrementLoopPlay(id: string, now: number): Promise<void> {
  const loop = await db.loops.get(id);
  if (loop) await db.loops.update(id, { playCount: loop.playCount + 1, updatedAt: now });
}
