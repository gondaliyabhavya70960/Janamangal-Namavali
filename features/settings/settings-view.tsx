"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  Database,
  Download,
  Gauge,
  HardDriveDownload,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sun,
  Target,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useSettingsStore } from "@/store/settings";
import { usePlayerStore } from "@/store/player";
import { ACCENT_PRESETS, APP_NAME } from "@/lib/constants";
import {
  buildBackup,
  clearLibrary,
  estimateStorage,
  isStoragePersisted,
  requestPersistentStorage,
  resetApp,
  restoreBackup,
} from "@/services/backup";
import { requestNotificationPermission, sendNotification } from "@/lib/notifications";
import { cn, downloadText, formatBytes } from "@/lib/utils";
import type { BackupFile, ThemeMode } from "@/types";

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const THEMES: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function SettingsView() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const reset = useSettingsStore((s) => s.reset);
  const configure = usePlayerStore((s) => s.configure);
  const resetPlayer = usePlayerStore((s) => s.resetPlayer);
  const { setTheme } = useTheme();
  const importRef = useRef<HTMLInputElement>(null);

  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [persisted, setPersisted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    void estimateStorage().then(setStorage);
    void isStoragePersisted().then(setPersisted);
  }, []);

  const makePersistent = async () => {
    const ok = await requestPersistentStorage();
    setPersisted(ok);
    toast[ok ? "success" : "error"](
      ok ? "Storage is now permanent on this device" : "Your browser declined permanent storage",
    );
  };

  const exportBackup = async () => {
    const toastId = toast.loading("Preparing backup…");
    const backup = await buildBackup(Date.now());
    downloadText(JSON.stringify(backup), `riyaz-backup-${new Date().toISOString().slice(0, 10)}.json`);
    await update({ lastBackupAt: Date.now() });
    toast.success("Backup downloaded", { id: toastId });
  };

  const importBackup = async (file: File) => {
    const toastId = toast.loading("Restoring backup…");
    try {
      const backup = JSON.parse(await file.text()) as BackupFile;
      const result = await restoreBackup(backup);
      toast.success(`Restored ${result.songs} songs, ${result.playlists} playlists`, { id: toastId });
    } catch (error) {
      toast.error("Restore failed", { id: toastId, description: (error as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Tune the studio to your workflow." />

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4 text-primary" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">
          <Row label="Theme" hint="Dark, light, or follow your system.">
            <div className="flex gap-1.5">
              {THEMES.map((t) => (
                <Button
                  key={t.value}
                  size="sm"
                  variant={settings.theme === t.value ? "default" : "secondary"}
                  onClick={() => {
                    setTheme(t.value);
                    void update({ theme: t.value });
                  }}
                >
                  <t.icon className="size-4" /> {t.label}
                </Button>
              ))}
            </div>
          </Row>
          <Row label="Accent color" hint="Used across highlights and the player.">
            <div className="flex flex-wrap justify-end gap-2">
              {ACCENT_PRESETS.map((accent) => (
                <button
                  key={accent.key}
                  onClick={() => void update({ accent: accent.key })}
                  className={cn(
                    "size-7 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all",
                    settings.accent === accent.key ? "ring-foreground" : "ring-transparent hover:scale-110",
                  )}
                  style={{ background: `hsl(${accent.primary})` }}
                  aria-label={accent.name}
                />
              ))}
            </div>
          </Row>
          <Row label="Reduce motion" hint="Minimise animations and transitions.">
            <Switch
              checked={settings.reduceMotion}
              onCheckedChange={(v) => void update({ reduceMotion: v })}
            />
          </Row>
        </CardContent>
      </Card>

      {/* Playback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="size-4 text-primary" /> Playback
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">
          <Row label="Preserve pitch" hint="Keep the original pitch when slowing down.">
            <Switch
              checked={settings.preservePitch}
              onCheckedChange={(v) => {
                void update({ preservePitch: v });
                configure({ preservePitch: v });
              }}
            />
          </Row>
          <Row label="Auto-resume" hint="Continue from where you left off.">
            <Switch checked={settings.autoResume} onCheckedChange={(v) => void update({ autoResume: v })} />
          </Row>
          <div className="py-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Default speed</p>
              <span className="text-sm tabular-nums text-muted-foreground">{settings.defaultSpeed}×</span>
            </div>
            <Slider
              min={0.25}
              max={2}
              step={0.05}
              value={[settings.defaultSpeed]}
              onValueChange={([v]) => {
                const speed = Number(v.toFixed(2));
                void update({ defaultSpeed: speed });
                configure({ speed });
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">Applied to new tracks · 0.25× to 2×</p>
          </div>
          <div className="py-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Default volume</p>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.round(settings.defaultVolume * 100)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[settings.defaultVolume]}
              onValueChange={([v]) => {
                void update({ defaultVolume: v });
                configure({ volume: v });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Practice goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4 text-primary" /> Practice
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">
          <Row label="Daily goal (minutes)" hint="Your target practice time each day.">
            <Input
              type="number"
              min={1}
              className="w-24"
              value={settings.dailyGoalMinutes}
              onChange={(e) => void update({ dailyGoalMinutes: Math.max(1, Number(e.target.value) || 1) })}
            />
          </Row>
          <Row label="Break reminder (minutes)" hint="Suggest a rest after continuous practice.">
            <Input
              type="number"
              min={0}
              className="w-24"
              value={settings.breakReminderMinutes}
              onChange={(e) => void update({ breakReminderMinutes: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Row>
        </CardContent>
      </Card>

      {/* Notifications + shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4 text-primary" /> Notifications & input
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">
          <Row label="Desktop notifications" hint="Goal achieved, break reminders, practice complete.">
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={async (v) => {
                if (v) {
                  const granted = await requestNotificationPermission();
                  if (!granted) {
                    toast.error("Notification permission denied");
                    return;
                  }
                  sendNotification(`${APP_NAME} notifications enabled`, { body: "We'll cheer your milestones." });
                }
                void update({ notificationsEnabled: v });
              }}
            />
          </Row>
          <Row label="Keyboard shortcuts" hint="Space to play, [ ] for loops, and more.">
            <Switch
              checked={settings.keyboardShortcutsEnabled}
              onCheckedChange={(v) => void update({ keyboardShortcutsEnabled: v })}
            />
          </Row>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-primary" /> Data & backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 rounded-xl bg-muted/50 p-3 text-sm">
            {storage && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">On-device storage used</span>
                <span className="tabular-nums">
                  {formatBytes(storage.usage)} {storage.quota > 0 && `/ ${formatBytes(storage.quota)}`}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">
                Permanent storage{" "}
                <span className="text-xs">(protects your library from auto-cleanup)</span>
              </span>
              {persisted ? (
                <Badge variant="success" className="gap-1">
                  <ShieldCheck className="size-3.5" /> On
                </Badge>
              ) : (
                <Button size="sm" variant="secondary" onClick={makePersistent}>
                  Make permanent
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Everything is stored locally on this device — no account, no server. Export a backup
              regularly so you can move your data or restore it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportBackup}>
              <Download className="size-4" /> Export backup
            </Button>
            <Button variant="secondary" onClick={() => importRef.current?.click()}>
              <Upload className="size-4" /> Import backup
            </Button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) void importBackup(e.target.files[0]);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => setConfirmClear(true)}>
              <HardDriveDownload className="size-4" /> Clear library
            </Button>
            <Button variant="outline" className="text-destructive" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="size-4" /> Reset app
            </Button>
          </div>
          {settings.lastBackupAt && (
            <p className="text-xs text-muted-foreground">
              Last backup: {new Date(settings.lastBackupAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="pb-4 text-center text-xs text-muted-foreground">
        {APP_NAME} · runs fully offline · your data lives only on this device. Export a backup to keep
        a copy or move it elsewhere.
      </p>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear your library?"
        description="Removes all songs, loops and playlists. Practice history and stats are kept."
        confirmLabel="Clear library"
        destructive
        onConfirm={async () => {
          await clearLibrary();
          resetPlayer();
          toast.success("Library cleared");
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset everything?"
        description="Permanently deletes all songs, history, stats and settings. This cannot be undone."
        confirmLabel="Reset app"
        destructive
        onConfirm={async () => {
          await resetApp();
          resetPlayer();
          await reset();
          toast.success("App reset to defaults");
        }}
      />
    </div>
  );
}
