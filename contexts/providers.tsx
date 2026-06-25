"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useSettingsStore } from "@/store/settings";
import { usePlayerStore } from "@/store/player";
import { requestPersistentStorage } from "@/services/backup";

/**
 * Bootstraps client-only side effects exactly once: hydrate settings from
 * IndexedDB, attach the audio engine, and keep next-themes in sync with the
 * persisted theme preference.
 */
function AppBootstrap({ children }: { children: ReactNode }) {
  const loadSettings = useSettingsStore((s) => s.load);
  const settings = useSettingsStore((s) => s.settings);
  const loaded = useSettingsStore((s) => s.loaded);
  const attach = usePlayerStore((s) => s.attach);
  const configure = usePlayerStore((s) => s.configure);
  const { setTheme } = useTheme();

  useEffect(() => {
    void loadSettings();
    attach();
    // Best-effort: keep the on-device library safe from automatic eviction.
    void requestPersistentStorage();
  }, [loadSettings, attach]);

  // Apply persisted playback defaults + theme once settings are ready.
  useEffect(() => {
    if (!loaded) return;
    setTheme(settings.theme);
    configure({
      volume: settings.defaultVolume,
      speed: settings.defaultSpeed,
      preservePitch: settings.preservePitch,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AppBootstrap>{children}</AppBootstrap>
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          toastOptions={{ className: "rounded-xl border-border/60" }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
