"use client";

import { useParams } from "next/navigation";
import { PlaylistDetail } from "@/features/playlists/playlist-detail";

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  return <PlaylistDetail id={params.id} />;
}
