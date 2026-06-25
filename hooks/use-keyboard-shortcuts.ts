"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { usePlayerStore } from "@/store/player";
import { useUIStore } from "@/store/ui";
import { useSettingsStore } from "@/store/settings";
import { toggleSongFavorite } from "@/services/songs";

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT"
  );
}

/** Global keyboard shortcut handler. Mounted once by the app shell. */
export function useKeyboardShortcuts() {
  const enabled = useSettingsStore((s) => s.settings.keyboardShortcutsEnabled);

  useEffect(() => {
    if (!enabled) return;
    const player = usePlayerStore.getState;
    const ui = useUIStore.getState;

    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Command palette — always available, even while typing.
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ui().toggleCommand();
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.altKey) return;

      // Help + search (no modifiers).
      if (e.key === "?") {
        e.preventDefault();
        ui().setShortcutsOpen(true);
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        ui().setCommandOpen(true);
        return;
      }

      if (meta) return; // leave other ⌘/Ctrl combos to the browser

      switch (e.code) {
        case "Space":
          e.preventDefault();
          player().togglePlay();
          return;
        case "ArrowLeft":
          e.preventDefault();
          player().seekBy(-5);
          return;
        case "ArrowRight":
          e.preventDefault();
          player().seekBy(5);
          return;
        case "ArrowUp":
          e.preventDefault();
          player().nudgeVolume(0.05);
          return;
        case "ArrowDown":
          e.preventDefault();
          player().nudgeVolume(-0.05);
          return;
        case "Minus":
          player().nudgeSpeed(-1);
          return;
        case "Equal":
          player().nudgeSpeed(1);
          return;
        case "Digit0":
          player().resetSpeed();
          return;
        case "BracketLeft":
          player().setLoopStart();
          toast.success("Loop start set");
          return;
        case "BracketRight":
          player().setLoopEnd();
          toast.success("Loop end set");
          return;
        case "Backslash":
          player().clearLoop();
          return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
          if (e.shiftKey) void player().next();
          return;
        case "p":
          if (e.shiftKey) void player().previous();
          return;
        case "l":
          player().toggleLoop();
          return;
        case "s":
          player().toggleShuffle();
          return;
        case "r":
          player().cycleRepeat();
          return;
        case "m":
          player().toggleMute();
          return;
        case "f": {
          const song = player().currentSong;
          if (song) {
            void toggleSongFavorite(song.id);
            toast.success("Toggled favorite");
          }
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
