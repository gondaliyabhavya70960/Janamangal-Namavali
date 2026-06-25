import type { Metadata } from "next";
import { StatsView } from "@/features/stats/stats-view";

export const metadata: Metadata = { title: "Statistics" };

export default function StatsPage() {
  return <StatsView />;
}
