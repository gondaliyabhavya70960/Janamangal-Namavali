"use client";

import { create } from "zustand";
import { DEFAULT_SETTINGS, getAccent } from "@/lib/constants";
import { getSettings, resetSettings, updateSettings } from "@/services/settings";
import type { AppSettings } from "@/types";

export interface SettingsState {
  settings: AppSettings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

/** Apply the accent preset to CSS custom properties consumed by the design system. */
export function applyAccent(key: string) {
  if (typeof document === "undefined") return;
  const accent = getAccent(key);
  const root = document.documentElement;
  root.style.setProperty("--primary", accent.primary);
  root.style.setProperty("--ring", accent.ring);
  root.style.setProperty("--sidebar-primary", accent.primary);
}

export function applyReduceMotion(reduce: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("reduce-motion", reduce);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  async load() {
    const settings = await getSettings();
    applyAccent(settings.accent);
    applyReduceMotion(settings.reduceMotion);
    set({ settings, loaded: true });
  },

  async update(patch) {
    const next = await updateSettings(patch);
    if (patch.accent) applyAccent(patch.accent);
    if (patch.reduceMotion != null) applyReduceMotion(patch.reduceMotion);
    set({ settings: next });
  },

  async reset() {
    const next = await resetSettings();
    applyAccent(next.accent);
    applyReduceMotion(next.reduceMotion);
    set({ settings: next });
  },
}));
