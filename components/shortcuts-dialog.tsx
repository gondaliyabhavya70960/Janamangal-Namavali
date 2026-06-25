"use client";

import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/store/ui";
import { SHORTCUTS } from "@/lib/constants";

export function ShortcutsDialog() {
  const open = useUIStore((s) => s.shortcutsOpen);
  const setOpen = useUIStore((s) => s.setShortcutsOpen);

  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5 text-primary" /> Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>Practice faster without leaving the keyboard.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          {categories.map((category) => (
            <div key={category} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category}</p>
              <ul className="space-y-1.5">
                {SHORTCUTS.filter((s) => s.category === category).map((shortcut) => (
                  <li key={shortcut.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{shortcut.label}</span>
                    <span className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
