import { dateLabel, fullDateTime, timeLabel } from "@/lib/date";
import { formatDurationMs } from "@/lib/utils";
import type { HistoryEntry } from "@/types";

const CSV_COLUMNS: { key: keyof HistoryEntry | "playedReadable"; label: string }[] = [
  { key: "songTitle", label: "Song" },
  { key: "songArtist", label: "Artist" },
  { key: "date", label: "Date" },
  { key: "startedAt", label: "Start" },
  { key: "endedAt", label: "End" },
  { key: "playedReadable", label: "Duration" },
  { key: "speed", label: "Speed" },
  { key: "loopName", label: "Loop" },
  { key: "loopCount", label: "Loops" },
  { key: "deviceLabel", label: "Device" },
  { key: "online", label: "Online" },
  { key: "favorite", label: "Favorite" },
];

function escapeCsv(value: unknown): string {
  const str = value === undefined || value === null ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function historyToCsv(entries: HistoryEntry[]): string {
  const header = CSV_COLUMNS.map((c) => c.label).join(",");
  const rows = entries.map((entry) =>
    CSV_COLUMNS.map((col) => {
      switch (col.key) {
        case "playedReadable":
          return escapeCsv(formatDurationMs(entry.playedMs));
        case "startedAt":
          return escapeCsv(timeLabel(entry.startedAt));
        case "endedAt":
          return escapeCsv(timeLabel(entry.endedAt));
        case "online":
          return escapeCsv(entry.online ? "Online" : "Offline");
        case "favorite":
          return escapeCsv(entry.favorite ? "Yes" : "No");
        default:
          return escapeCsv(entry[col.key as keyof HistoryEntry]);
      }
    }).join(","),
  );
  return [header, ...rows].join("\n");
}

export function historyToJson(entries: HistoryEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

/** Render history to a PDF document via jsPDF + autotable (loaded lazily). */
export async function historyToPdf(entries: HistoryEntry[]): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.text("Riyaz — Practice History", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Exported ${fullDateTime(Date.now())} · ${entries.length} sessions`, 14, 25);

  autoTable(doc, {
    startY: 32,
    head: [["Song", "Artist", "Date", "Time", "Duration", "Speed", "Loop", "Loops", "Mode"]],
    body: entries.map((e) => [
      e.songTitle,
      e.songArtist ?? "—",
      dateLabel(e.startedAt),
      `${timeLabel(e.startedAt)}`,
      formatDurationMs(e.playedMs),
      `${e.speed}x`,
      e.loopName ?? "—",
      String(e.loopCount),
      e.online ? "Online" : "Offline",
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [124, 92, 246] },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  return doc.output("blob");
}
