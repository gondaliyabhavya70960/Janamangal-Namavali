"use client";

import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { formatDurationMs } from "@/lib/utils";
import type { TimeBucket } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  ArcElement,
  DoughnutController,
  Filler,
  Tooltip,
  Legend,
);

function color(variable: string, alpha = 1): string {
  if (typeof window === "undefined") return "#7c5cf6";
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return alpha === 1 ? `hsl(${value})` : `hsl(${value} / ${alpha})`;
}

function baseOptions(): ChartOptions<"bar" | "line"> {
  const grid = color("--border", 0.5);
  const text = color("--muted-foreground");
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: color("--popover"),
        titleColor: color("--foreground"),
        bodyColor: color("--muted-foreground"),
        borderColor: color("--border"),
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => formatDurationMs((ctx.raw as number) || 0),
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: text, font: { size: 11 } }, border: { display: false } },
      y: {
        grid: { color: grid },
        border: { display: false },
        ticks: {
          color: text,
          font: { size: 11 },
          maxTicksLimit: 5,
          callback: (value) => `${Math.round((value as number) / 60000)}m`,
        },
      },
    },
  };
}

export function TrendBarChart({ buckets, height = 260 }: { buckets: TimeBucket[]; height?: number }) {
  return (
    <div style={{ height }}>
      <Bar
        options={baseOptions() as ChartOptions<"bar">}
        data={{
          labels: buckets.map((b) => b.label),
          datasets: [
            {
              data: buckets.map((b) => b.ms),
              backgroundColor: color("--primary", 0.85),
              hoverBackgroundColor: color("--primary"),
              borderRadius: 6,
              maxBarThickness: 36,
            },
          ],
        }}
      />
    </div>
  );
}

export function AreaTrendChart({ buckets, height = 260 }: { buckets: TimeBucket[]; height?: number }) {
  return (
    <div style={{ height }}>
      <Line
        options={baseOptions() as ChartOptions<"line">}
        data={{
          labels: buckets.map((b) => b.label),
          datasets: [
            {
              data: buckets.map((b) => b.ms),
              borderColor: color("--primary"),
              backgroundColor: color("--primary", 0.15),
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: color("--primary"),
              borderWidth: 2.5,
            },
          ],
        }}
      />
    </div>
  );
}

const PALETTE = ["--primary"];
const FALLBACK = ["#7c5cf6", "#22d3ee", "#34d399", "#f59e0b", "#f43f5e", "#a855f7", "#3b82f6", "#10b981"];

export function SpeedDoughnut({ usage, height = 220 }: { usage: Record<string, number>; height?: number }) {
  const entries = Object.entries(usage).filter(([, ms]) => ms > 0);
  if (entries.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No speed data yet.</p>;
  }
  return (
    <div style={{ height }}>
      <Doughnut
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: {
              position: "right",
              labels: { color: color("--muted-foreground"), boxWidth: 12, padding: 12, font: { size: 12 } },
            },
            tooltip: {
              backgroundColor: color("--popover"),
              borderColor: color("--border"),
              borderWidth: 1,
              cornerRadius: 10,
              callbacks: { label: (ctx) => `${ctx.label}: ${formatDurationMs(ctx.raw as number)}` },
            },
          },
        }}
        data={{
          labels: entries.map(([speed]) => speed),
          datasets: [
            {
              data: entries.map(([, ms]) => ms),
              backgroundColor: entries.map((_, i) => FALLBACK[i % FALLBACK.length]),
              borderColor: color("--card"),
              borderWidth: 2,
            },
          ],
        }}
      />
    </div>
  );
}

// Keep PALETTE referenced for future theming without tripping lint.
export const CHART_PALETTE = PALETTE;
