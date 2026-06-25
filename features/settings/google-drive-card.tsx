"use client";

import { useState } from "react";
import { CloudUpload, HardDriveDownload, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { buildBackup, restoreBackup } from "@/services/backup";
import {
  driveDownloadBackup,
  driveListBackups,
  driveUploadBackup,
  isDriveConfigured,
  type DriveBackup,
} from "@/services/google-drive";
import { shareOrDownloadBackup } from "@/lib/share";
import { useSettingsStore } from "@/store/settings";
import { fullDateTime } from "@/lib/date";
import { formatBytes } from "@/lib/utils";
import type { BackupFile } from "@/types";

export function GoogleDriveCard() {
  const configured = isDriveConfigured();
  const update = useSettingsStore((s) => s.update);
  const [busy, setBusy] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [backups, setBackups] = useState<DriveBackup[]>([]);
  const [pending, setPending] = useState<DriveBackup | null>(null);

  const fileName = `riyaz-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const backup = async () => {
    setBusy(true);
    const toastId = toast.loading(configured ? "Backing up to Google Drive…" : "Preparing backup…");
    try {
      const text = JSON.stringify(await buildBackup(Date.now()));
      if (configured) {
        await driveUploadBackup(text, fileName);
        await update({ lastBackupAt: Date.now() });
        toast.success("Backed up to your Google Drive", { id: toastId });
      } else {
        const how = await shareOrDownloadBackup(text, fileName);
        await update({ lastBackupAt: Date.now() });
        toast.success(how === "shared" ? "Backup ready to save to Drive" : "Backup downloaded — upload it to Drive", {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error("Backup failed", { id: toastId, description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const openList = async () => {
    setBusy(true);
    const toastId = toast.loading("Loading your Drive backups…");
    try {
      const list = await driveListBackups();
      setBackups(list);
      setListOpen(true);
      toast.dismiss(toastId);
      if (list.length === 0) toast.message("No backups found in your Drive yet.");
    } catch (error) {
      toast.error("Could not reach Google Drive", { id: toastId, description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const restore = async (item: DriveBackup) => {
    const toastId = toast.loading("Restoring from Google Drive…");
    try {
      const text = await driveDownloadBackup(item.id);
      const result = await restoreBackup(JSON.parse(text) as BackupFile);
      toast.success(`Restored ${result.songs} songs, ${result.playlists} playlists`, { id: toastId });
    } catch (error) {
      toast.error("Restore failed", { id: toastId, description: (error as Error).message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudUpload className="size-4 text-primary" /> Google Drive
          {configured ? (
            <Badge variant="success">Connected</Badge>
          ) : (
            <Badge variant="muted">Save / Share</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {configured
            ? "Sign in with Google to back up and restore your library to a “Riyaz Backups” folder in your Drive."
            : "One tap exports your backup and opens your device's share sheet so you can save it to the Google Drive app. To enable one-tap sign-in backup & restore, add a Google client ID (see README)."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={backup} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
            {configured ? "Back up to Drive" : "Save to Drive"}
          </Button>
          {configured && (
            <Button variant="secondary" onClick={openList} disabled={busy}>
              <HardDriveDownload className="size-4" /> Restore from Drive
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from Google Drive</DialogTitle>
            <DialogDescription>Choose a backup to restore. This replaces your current data.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-72">
            <div className="space-y-1 pr-3">
              {backups.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No backups in your Drive yet.</p>
              )}
              {backups.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setListOpen(false);
                    setPending(item);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <RefreshCw className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="block text-xs text-muted-foreground">{fullDateTime(Date.parse(item.createdTime))}</span>
                  </span>
                  {item.size && <span className="text-xs text-muted-foreground">{formatBytes(Number(item.size))}</span>}
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title="Restore this backup?"
        description="Your current songs, history and settings will be replaced with the contents of this backup."
        confirmLabel="Restore"
        destructive
        onConfirm={() => {
          if (pending) void restore(pending);
          setPending(null);
        }}
      />
    </Card>
  );
}
