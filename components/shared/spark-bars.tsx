import { formatDurationMs } from "@/lib/utils";
import type { TimeBucket } from "@/types";
import { cn } from "@/lib/utils";

/** Dependency-free CSS bar chart for compact trends (dashboard, cards). */
export function SparkBars({
  buckets,
  className,
  height = 64,
}: {
  buckets: TimeBucket[];
  className?: string;
  height?: number;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.ms));
  return (
    <div className={cn("flex items-end gap-1", className)} style={{ height }}>
      {buckets.map((bucket, i) => {
        const pct = (bucket.ms / max) * 100;
        const isLast = i === buckets.length - 1;
        return (
          <div
            key={bucket.date}
            className="group relative flex flex-1 flex-col items-center justify-end"
            title={`${bucket.label}: ${formatDurationMs(bucket.ms)}`}
          >
            <div
              className={cn(
                "w-full rounded-md transition-all",
                isLast ? "bg-primary" : "bg-primary/35 group-hover:bg-primary/60",
              )}
              style={{ height: `${Math.max(pct, bucket.ms > 0 ? 6 : 2)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
