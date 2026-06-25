import { db } from "@/db/database";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { AppSettings } from "@/types";

/** Read settings, seeding defaults on first run. */
export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get("app");
  if (existing) return { ...DEFAULT_SETTINGS, ...existing };
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next: AppSettings = { ...current, ...patch, id: "app" };
  await db.settings.put(next);
  return next;
}

export async function resetSettings(): Promise<AppSettings> {
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}
