import { db } from "@/db/database";
import { createId } from "@/lib/id";
import type { Goal, GoalKind } from "@/types";

export function listGoals(): Promise<Goal[]> {
  return db.goals.orderBy("createdAt").reverse().toArray();
}

export async function createGoal(input: {
  title: string;
  kind: GoalKind;
  target: number;
  now: number;
}): Promise<Goal> {
  const goal: Goal = {
    id: createId("goal"),
    title: input.title,
    kind: input.kind,
    target: input.target,
    active: true,
    createdAt: input.now,
    updatedAt: input.now,
  };
  await db.goals.put(goal);
  return goal;
}

export async function updateGoal(id: string, patch: Partial<Goal>, now: number): Promise<void> {
  await db.goals.update(id, { ...patch, updatedAt: now });
}

export async function removeGoal(id: string): Promise<void> {
  await db.goals.delete(id);
}

export async function markGoalAchieved(id: string, now: number): Promise<void> {
  await db.goals.update(id, { achievedAt: now, updatedAt: now });
}
