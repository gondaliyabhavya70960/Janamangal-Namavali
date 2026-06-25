import type { Metadata } from "next";
import { PlaylistsView } from "@/features/playlists/playlists-view";

export const metadata: Metadata = { title: "Playlists" };

export default function PlaylistsPage() {
  return <PlaylistsView />;
}
