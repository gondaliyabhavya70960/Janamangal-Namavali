import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Song } from "@/types";

const SIZES = {
  sm: "size-10 rounded-lg [&_svg]:size-4",
  md: "size-14 rounded-xl [&_svg]:size-6",
  lg: "size-20 rounded-2xl [&_svg]:size-8",
  xl: "size-44 rounded-3xl [&_svg]:size-16",
};

/** Deterministic gradient artwork derived from a song's accent colour. */
export function SongCover({
  song,
  size = "md",
  className,
  playing,
}: {
  song?: Pick<Song, "color" | "title"> | null;
  size?: keyof typeof SIZES;
  className?: string;
  playing?: boolean;
}) {
  const base = song?.color ?? "hsl(262 83% 60%)";
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden text-white/90 shadow-inner",
        SIZES[size],
        className,
      )}
      style={{
        background: `linear-gradient(140deg, ${base}, hsl(240 10% 12%))`,
      }}
      aria-hidden
    >
      <Music2 className="opacity-80" />
      {playing && (
        <span className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[1px]">
          <span className="flex items-end gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-0.5 animate-[pulse-ring_1s_ease-in-out_infinite] rounded-full bg-white"
                style={{ height: 8 + i * 3, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        </span>
      )}
    </div>
  );
}
