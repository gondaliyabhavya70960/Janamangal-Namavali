import { CloudOff } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="py-10">
      <EmptyState
        icon={CloudOff}
        title="You're offline"
        description="This page hasn't been cached yet, but your library, player and stats all work without a connection. Head back to continue practising."
      />
    </div>
  );
}
