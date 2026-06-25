"use client";

import { getDay } from "date-fns";
import { dayKeyToDate, monthDayLabel } from "@/lib/date";
import { formatDurationMs } from "@/lib/utils";
import type { HeatmapCell } from "@/types";
import { cn } from "@/lib/utils";

const LEVEL_CLASS: Record<HeatmapCell["level"], string> = {
  0: "bg-muted/50",
  1: "bg-primary/25",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
};

/** GitHub-style contribution heatmap of daily practice time. */
export function PracticeHeatmap({ cells }: { cells: HeatmapCell[] }) {
  if (cells.length === 0) return null;
  // Pad the leading week so each column is a Mon→Sun stack.
  const firstWeekday = (getDay(dayKeyToDate(cells[0].date)) + 6) % 7; // Mon = 0
  const padded: (HeatmapCell | null)[] = [...Array(firstWeekday).fill(null), ...cells];

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto pb-1">
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {padded.map((cell, i) =>
            cell ? (
              <div
                key={cell.date}
                title={`${monthDayLabel(cell.date)} · ${formatDurationMs(cell.ms)}`}
                className={cn("size-3 rounded-[3px] transition-colors", LEVEL_CLASS[cell.level])}
              />
            ) : (
              <div key={`pad-${i}`} className="size-3" />
            ),
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className={cn("size-3 rounded-[3px]", LEVEL_CLASS[level as HeatmapCell["level"]])} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
