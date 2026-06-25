"use client";

import { create } from "zustand";

export interface UIState {
  commandOpen: boolean;
  shortcutsOpen: boolean;
  fullPlayerOpen: boolean;
  floatingPlayerOpen: boolean;
  queueOpen: boolean;
  mobileNavOpen: boolean;
  globalQuery: string;
  selectedSongIds: string[];

  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setFullPlayerOpen: (open: boolean) => void;
  setFloatingPlayerOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setGlobalQuery: (query: string) => void;

  toggleSongSelection: (id: string) => void;
  selectSongs: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

export const useUIStore = create<UIState>((set, get) => ({
  commandOpen: false,
  shortcutsOpen: false,
  fullPlayerOpen: false,
  floatingPlayerOpen: false,
  queueOpen: false,
  mobileNavOpen: false,
  globalQuery: "",
  selectedSongIds: [],

  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((state) => ({ commandOpen: !state.commandOpen })),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setFullPlayerOpen: (fullPlayerOpen) => set({ fullPlayerOpen }),
  setFloatingPlayerOpen: (floatingPlayerOpen) => set({ floatingPlayerOpen }),
  setQueueOpen: (queueOpen) => set({ queueOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setGlobalQuery: (globalQuery) => set({ globalQuery }),

  toggleSongSelection: (id) =>
    set((state) => ({
      selectedSongIds: state.selectedSongIds.includes(id)
        ? state.selectedSongIds.filter((s) => s !== id)
        : [...state.selectedSongIds, id],
    })),
  selectSongs: (ids) => set({ selectedSongIds: ids }),
  clearSelection: () => set({ selectedSongIds: [] }),
  isSelected: (id) => get().selectedSongIds.includes(id),
}));
