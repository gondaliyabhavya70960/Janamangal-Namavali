"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Heart,
  History,
  LayoutDashboard,
  Library,
  ListMusic,
  Moon,
  Music2,
  Search,
  Settings,
  Shuffle,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSongs, usePlaylists } from "@/hooks/use-data";
import { usePlayerStore } from "@/store/player";
import { useUIStore } from "@/store/ui";
import { useSettingsStore } from "@/store/settings";
import { globalSearch } from "@/services/search";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const updateSettings = useSettingsStore((s) => s.update);
  const songs = useSongs();
  const playlists = usePlaylists().filter((p) => !p.smart);
  const playSong = usePlayerStore((s) => s.playSong);
  const loadQueue = usePlayerStore((s) => s.loadQueue);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) setQuery("");
    setActive(0);
  }, [open]);

  const close = () => setOpen(false);

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = [
      { id: "nav-dash", label: "Dashboard", icon: LayoutDashboard, group: "Go to", run: () => router.push("/") },
      { id: "nav-lib", label: "Library", icon: Library, group: "Go to", run: () => router.push("/library") },
      { id: "nav-pl", label: "Playlists", icon: ListMusic, group: "Go to", run: () => router.push("/playlists") },
      { id: "nav-fav", label: "Favorites", icon: Heart, group: "Go to", run: () => router.push("/favorites") },
      { id: "nav-hist", label: "History", icon: History, group: "Go to", run: () => router.push("/history") },
      { id: "nav-stats", label: "Statistics", icon: BarChart3, group: "Go to", run: () => router.push("/stats") },
      { id: "nav-set", label: "Settings", icon: Settings, group: "Go to", run: () => router.push("/settings") },
    ];
    const actions: Command[] = [
      {
        id: "act-theme",
        label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        icon: theme === "dark" ? Sun : Moon,
        group: "Actions",
        run: () => {
          const next = theme === "dark" ? "light" : "dark";
          setTheme(next);
          void updateSettings({ theme: next });
        },
      },
      {
        id: "act-shuffle",
        label: "Shuffle entire library",
        icon: Shuffle,
        group: "Actions",
        run: () => songs.length && void loadQueue(songs, 0, true),
      },
      {
        id: "act-shortcuts",
        label: "Show keyboard shortcuts",
        icon: Search,
        group: "Actions",
        run: () => setShortcutsOpen(true),
      },
    ];

    const q = query.trim();
    const results = q ? globalSearch(q, { songs, playlists, history: [] }, 6) : { songs: songs.slice(0, 5), playlists: [], history: [] };
    const songCommands: Command[] = results.songs.map((song) => ({
      id: `song-${song.id}`,
      label: song.title,
      hint: song.artist,
      icon: Music2,
      group: "Songs",
      run: () => void playSong(song, songs),
    }));
    const playlistCommands: Command[] = results.playlists.map((pl) => ({
      id: `pl-${pl.id}`,
      label: pl.name,
      icon: ListMusic,
      group: "Playlists",
      run: () => router.push(`/playlists/${pl.id}`),
    }));

    const all = [...songCommands, ...playlistCommands, ...nav, ...actions];
    if (!q) return all;
    const lower = q.toLowerCase();
    return all.filter(
      (c) => c.label.toLowerCase().includes(lower) || c.hint?.toLowerCase().includes(lower) || c.group === "Songs" || c.group === "Playlists",
    );
  }, [query, songs, playlists, theme, router, setTheme, updateSettings, playSong, loadQueue, setShortcutsOpen]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    commands.forEach((c) => {
      const list = map.get(c.group) ?? [];
      list.push(c);
      map.set(c.group, list);
    });
    return Array.from(map.entries());
  }, [commands]);

  const flat = commands;

  const runActive = () => {
    const command = flat[active];
    if (command) {
      command.run();
      close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent hideClose className="top-[20%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border/60 px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, flat.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                runActive();
              }
            }}
            placeholder="Search songs, jump to a page, run a command…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {flat.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No results.</p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group}</p>
                {items.map((command) => {
                  const index = flat.indexOf(command);
                  return (
                    <button
                      key={command.id}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => {
                        command.run();
                        close();
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                        active === index ? "bg-accent" : "hover:bg-accent/50",
                      )}
                    >
                      <command.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{command.label}</span>
                      {command.hint && <span className="truncate text-xs text-muted-foreground">{command.hint}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
