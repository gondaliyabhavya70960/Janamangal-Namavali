"use client";

import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { historyToCsv, historyToJson, historyToPdf } from "@/services/export";
import { downloadBlob, downloadText } from "@/lib/utils";
import type { HistoryEntry } from "@/types";

export function ExportMenu({ entries }: { entries: HistoryEntry[] }) {
  const stamp = new Date().toISOString().slice(0, 10);

  const exportCsv = () => {
    downloadText(historyToCsv(entries), `riyaz-history-${stamp}.csv`, "text/csv");
    toast.success("Exported CSV");
  };
  const exportJson = () => {
    downloadText(historyToJson(entries), `riyaz-history-${stamp}.json`);
    toast.success("Exported JSON");
  };
  const exportPdf = async () => {
    const blob = await historyToPdf(entries);
    downloadBlob(blob, `riyaz-history-${stamp}.pdf`);
    toast.success("Exported PDF");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={entries.length === 0}>
          <Download className="size-4" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Export {entries.length} rows</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportCsv}>
          <FileSpreadsheet /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJson}>
          <FileJson /> JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void exportPdf()}>
          <FileText /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
