import { AudioLines } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ withWordmark = true, className }: { withWordmark?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-md shadow-primary/30">
        <AudioLines className="size-5" />
      </span>
      {withWordmark && <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>}
    </div>
  );
}
