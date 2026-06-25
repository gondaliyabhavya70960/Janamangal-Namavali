<div align="center">

# 🎵 Riyaz — Music Practice Studio

**Practice, perfected.** An offline‑first, installable PWA for musicians, dancers, singers and
anyone who improves by practising with looping audio — with precise time tracking, A↔B looping,
pitch‑preserving speed control, a waveform editor and beautiful analytics.

_Riyaz_ (रियाज़) is the Hindustani word for disciplined, repeated music practice.

`Next.js 15` · `React 19` · `TypeScript` · `Tailwind v4` · `Dexie/IndexedDB` · `WaveSurfer.js` · `Serwist PWA`

</div>

---

## ✨ Highlights

- **100% offline & zero backend.** Every track, playlist, loop, history row and setting lives in
  your browser's IndexedDB. The app shell is precached by a service worker, so it launches instantly
  even on a plane.
- **Precise practice timer.** Time only accrues while audio is _actually_ playing — pauses don't
  count — and is rolled up into daily / weekly / monthly / lifetime totals, a streak and a heatmap.
- **Pitch‑preserving speed control.** Slow a passage to 0.25× without dropping an octave, via the
  native media element's `preservesPitch`. Eight presets plus a fine slider.
- **A↔B looping with a waveform.** Drag loop handles on the WaveSurfer waveform, set loop points by
  keyboard (`[` / `]`), count repetitions, and save/rename/favorite loop presets per song.
- **Premium UI.** Dark‑first, glassmorphism, Framer Motion, a command palette (`⌘K`), a floating
  PiP‑style mini player, full keyboard control and WCAG‑minded focus states.

---

## 📑 Table of contents

1. [Project architecture](#-project-architecture)
2. [Folder structure](#-folder-structure)
3. [Database schema](#-database-schema)
4. [UI design system](#-ui-design-system)
5. [Component list](#-component-list)
6. [State management](#-state-management)
7. [Offline strategy](#-offline-strategy)
8. [Audio engine architecture](#-audio-engine-architecture)
9. [Feature modules](#-feature-modules)
10. [Keyboard shortcuts](#-keyboard-shortcuts)
11. [Getting started / installation](#-getting-started)
12. [Build instructions](#-build-instructions)
13. [Deployment guide](#-deployment-guide)
14. [Accessibility & performance](#-accessibility--performance)
15. [Future improvements](#-future-improvements)

---

## 🏛 Project architecture

Riyaz is a **client‑first, layered** application. There is no server tier — Next.js is used purely
as the build tool, router and PWA host, and all pages are statically rendered. Data and audio never
leave the device.

```
┌──────────────────────────────────────────────────────────────┐
│  app/ (Next.js App Router — thin route shells, RSC)            │
├──────────────────────────────────────────────────────────────┤
│  features/ • components/  — React UI (mostly client)           │
│      consumes stores + hooks, never touches Dexie directly     │
├──────────────────────────────────────────────────────────────┤
│  store/ (Zustand)        hooks/ (useLiveQuery wrappers)         │
│      player • settings • ui          reactive reads of Dexie    │
├──────────────────────────────────────────────────────────────┤
│  services/  — repositories: the ONLY layer that imports the DB  │
│      songs • playlists • loops • history • stats • backup • …   │
├──────────────────────────────────────────────────────────────┤
│  lib/audio/  — framework‑agnostic engine                        │
│      AudioEngine (HTMLMediaElement) • PracticeTracker           │
├──────────────────────────────────────────────────────────────┤
│  db/ (Dexie)             public/sw.js (Serwist service worker)  │
│      IndexedDB schema                app‑shell precache + cache  │
└──────────────────────────────────────────────────────────────┘
```

**Layering rules**

- UI components read data through **hooks** (`useLiveQuery`) and **stores**, and mutate through
  **services**. They never import `db/` directly — this keeps persistence swappable and testable.
- **Services** are the single boundary to Dexie. Every write that affects analytics goes through a
  transaction that updates the entity, the `dailyStats` rollup and the song aggregate together.
- The **audio engine** has no React/Next dependency, so it can be unit‑tested and reused. The store
  is the bridge between engine events and React state.

Principles applied: **SOLID** (single‑responsibility services, dependency inversion via the service
boundary), **DRY/KISS** (one reusable `SongRow`, `SongList`, `StatTile`), strong TypeScript
end‑to‑end, Server Components for route shells and Client Components only where interactivity demands.

---

## 🗂 Folder structure

```
riyaz/
├── app/                      # Next.js App Router (route shells + PWA entry)
│   ├── layout.tsx            # Root layout, metadata, providers, AppShell
│   ├── page.tsx              # Dashboard route
│   ├── library/ playlists/ favorites/ history/ stats/ settings/ offline/
│   ├── manifest.ts           # Web App Manifest (generated route)
│   └── sw.ts                 # Serwist service worker source → public/sw.js
├── components/
│   ├── ui/                   # shadcn‑style primitives (button, dialog, slider…)
│   ├── shared/               # cross‑feature pieces (SongCover, StatTile, EmptyState…)
│   ├── app-shell.tsx sidebar.tsx top-bar.tsx mobile-nav.tsx
│   ├── command-palette.tsx shortcuts-dialog.tsx nav.ts
├── features/                 # feature‑scoped UI modules
│   ├── player/               # PlayerBar, FullPlayer, FloatingMiniPlayer, transport…
│   ├── waveform/             # WaveSurfer waveform + loop regions
│   ├── loops/ library/ dashboard/ stats/ history/ playlists/ favorites/ settings/
├── hooks/                    # useData (live queries), useUpload, useKeyboardShortcuts, usePwa…
├── lib/                      # utils, constants, date, device, notifications, id
│   └── audio/                # engine.ts, practice-tracker.ts, decode.ts
├── services/                 # repositories (the DB boundary) + stats/backup/export/search
├── store/                    # Zustand: player.ts, settings.ts, ui.ts
├── db/                       # database.ts (Dexie schema + singleton)
├── types/                    # db.ts, audio.ts, stats.ts (domain types)
├── contexts/                 # providers.tsx (theme, query, bootstrap, toaster)
├── styles/                   # globals.css (Tailwind v4 design tokens + utilities)
├── public/                   # icons, generated sw.js
└── scripts/                  # generate-icons.mjs, smoke.mjs (verification)
```

---

## 🗄 Database schema

A single IndexedDB database (`riyaz`) managed by **Dexie**. Audio binary data is kept in a dedicated
table so listing the library never deserialises megabytes of audio.

| Table | Primary key | Indexes | Purpose |
| --- | --- | --- | --- |
| `songs` | `id` | title, artist, favorite, pinned, playCount, totalPracticeMs, lastPlayedAt, createdAt, `*tags` | Light, list‑friendly metadata + cached waveform peaks |
| `blobs` | `songId` | — | Audio `Blob` (and optional cover) — the heavy payload |
| `playlists` | `id` | name, favorite, smart, pinnedAt, updatedAt | Curated + smart playlists |
| `loops` | `id` | songId, favorite, playCount, updatedAt | Saved A↔B loop presets |
| `history` | `id` | songId, date, startedAt, endedAt, favorite, speed | Per‑play records — the analytics source of truth |
| `sessions` | `id` | startedAt, endedAt, favorite | Broader practice blocks spanning songs |
| `dailyStats` | `date` | — | Pre‑aggregated per‑day rollup (dashboard, streak, heatmap) |
| `goals` | `id` | kind, active | Practice goals |
| `settings` | `id` (`"app"`) | — | Single settings row |

**Why a `dailyStats` rollup?** Streaks, the heatmap and the dashboard need fast day‑bucketed
aggregates. Every committed slice of listening time increments the day's rollup in the same
transaction, so reads stay O(days) instead of scanning all history.

Full type definitions live in [`types/db.ts`](./types/db.ts).

---

## 🎨 UI design system

- **Tailwind CSS v4** with a token layer in [`styles/globals.css`](./styles/globals.css). Colours are
  HSL channel triples exposed as CSS variables and mapped into Tailwind via `@theme inline`, so every
  utility (`bg-card`, `text-muted-foreground`, …) is theme‑ and opacity‑aware.
- **Dark‑first**, with light and system themes via `next-themes`. The `--primary` / `--ring` accent is
  overridden at runtime from the settings store, giving **8 live accent presets**.
- **Custom utilities** registered with Tailwind v4's `@utility`: `glass` / `glass-strong`
  (glassmorphism), `anim-in` / `anim-up` (Radix overlay enter animations), `text-gradient`,
  `glow-primary`, plus an `app-aurora` backdrop and a `skeleton` shimmer.
- **shadcn‑style primitives** built on Radix UI (Dialog, Dropdown, Slider, Switch, Tabs, Tooltip,
  Select, Popover, ScrollArea, Sheet) with `class-variance-authority` variants.
- **Motion** via Framer Motion (floating mini player drag, selection bar, list transitions), all
  respecting a **Reduce motion** setting.

---

## 🧩 Component list

**Primitives** (`components/ui`): Button, Card, Badge, Input, Label, Progress, Skeleton, Separator,
Slider, Switch, Tabs, Tooltip/Hint, Dialog, Sheet, DropdownMenu, Popover, ScrollArea, Select.

**Shared** (`components/shared`): Logo, SongCover, StatTile, SparkBars, EmptyState, PageHeader,
ConfirmDialog.

**Chrome**: AppShell, Sidebar, TopBar, MobileNav, CommandPalette, ShortcutsDialog.

**Player**: PlayerBar (mini), FullPlayer (fullscreen), FloatingMiniPlayer (PiP), TransportControls,
SeekBar, VolumeControl, SpeedControl, LoopControls, SleepTimer, QueuePanel.

**Features**: Waveform, LoopManager, UploadDropzone/Button, UrlImportDialog, SongRow, SongList,
SelectionBar, AddToPlaylistDialog, DashboardView, StatsView (+ charts, heatmap), HistoryView
(+ ExportMenu), PlaylistsView/PlaylistDetail, FavoritesView, SettingsView.

---

## 🧠 State management

- **Zustand** for transient/runtime state:
  - `store/player.ts` — queue, playback, repeat/shuffle, loop region, sleep timer; orchestrates the
    audio engine + practice tracker and persists history.
  - `store/settings.ts` — persisted settings mirror; applies accent + reduce‑motion side effects.
  - `store/ui.ts` — command palette, dialogs, multi‑select, floating player, global query.
- **Dexie `useLiveQuery`** (`hooks/use-data.ts`) for reactive reads — components automatically
  re‑render when the underlying tables change, with no manual cache invalidation.
- **TanStack Query** for genuinely async, non‑Dexie work (e.g. URL import mutation).

---

## 📴 Offline strategy

| Layer | Tech | What it stores |
| --- | --- | --- |
| App shell | **Serwist** service worker (`app/sw.ts` → `public/sw.js`) | Precached hashed JS/CSS/HTML + runtime caching for navigations & static assets |
| User data | **IndexedDB** (Dexie) | Songs (as Blobs), playlists, loops, history, sessions, stats, settings, goals |
| Fallback | `/offline` route | Friendly page when an uncached navigation is requested offline |

Because audio and data live in IndexedDB (not the Cache API), they are available regardless of
network — the service worker only needs to cache the UI. The app is fully **installable** (manifest +
maskable icons), shows an in‑app **Install** button via `beforeinstallprompt`, and surfaces an
**Offline** badge when the connection drops.

---

## 🔊 Audio engine architecture

The engine ([`lib/audio/engine.ts`](./lib/audio/engine.ts)) owns a single native
`HTMLAudioElement`.

> **Design decision — native media element over Web‑Audio buffers/Howler.** A _practice_ tool must
> slow audio **without changing pitch**. Only the media element exposes `preservesPitch`, so the
> engine is built on it. **WaveSurfer.js attaches to the very same element**
> (`WaveSurfer.create({ media })`), guaranteeing the waveform cursor, click‑to‑seek and loop region
> never drift from playback. Howler was evaluated but rejected for this reason.

- **Looping** is enforced on both `requestAnimationFrame` (tight while visible) and `timeupdate`
  (keeps working in a backgrounded tab), de‑duplicated by a short cooldown so each wrap counts once.
- **Precise time tracking** ([`practice-tracker.ts`](./lib/audio/practice-tracker.ts)): the store runs
  a 1 s tick **only while playing**; each tick adds real wall‑clock elapsed (capped so a suspended tab
  can't inject a huge jump). Deltas flush to IndexedDB every ~5 s and on every lifecycle edge (pause,
  track change, tab hidden, page hide), so a crash loses at most a few seconds.
- **Media Session API** wires lock‑screen / hardware media keys to the store.

---

## 🧱 Feature modules

Dashboard · Music Library (drag‑drop upload of mp3/wav/m4a/flac/ogg/aac, URL import) · Audio Player
(mini/full/floating, queue, sleep timer) · Speed Controller (pitch preservation) · Loop Controller
(presets, favorites) · Waveform Viewer · Practice Timer · Song History (search/filter, CSV/JSON/PDF
export) · Playlist Manager (smart playlists, drag reorder, duplicate) · Favorites · Global Search
(Fuse.js) · Statistics (Chart.js charts, heatmap) · Settings (themes, accents, data backup/restore) ·
Command Palette · Backup/Restore · Notifications.

---

## ⌨️ Keyboard shortcuts

| Keys | Action | Keys | Action |
| --- | --- | --- | --- |
| `Space` | Play / Pause | `[` / `]` | Set loop start / end |
| `←` / `→` | Seek ∓5 s | `L` / `\` | Toggle / clear loop |
| `↑` / `↓` | Volume | `S` / `R` | Shuffle / cycle repeat |
| `⇧N` / `⇧P` | Next / Previous | `-` `=` `0` | Speed down / up / reset |
| `M` | Mute | `F` | Favorite current song |
| `⌘K` / `/` | Command palette | `?` | Shortcuts dialog |

---

## 🚀 Getting started

**Prerequisites:** Node ≥ 18.18 and [pnpm](https://pnpm.io) (`corepack enable`).

```bash
pnpm install        # install dependencies
pnpm dev            # start the dev server → http://localhost:3000
```

> The service worker is **disabled in development** so you never fight a stale cache. PWA/offline
> behaviour is active in production builds.

Optional:

```bash
pnpm icons          # regenerate PWA icons (scripts/generate-icons.mjs)
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm format         # Prettier
```

---

## 🛠 Build instructions

```bash
pnpm build          # production build (also bundles the Serwist service worker)
pnpm start          # serve the production build → http://localhost:3000
```

The build emits static pages for every route plus `public/sw.js`. A browser smoke test that loads
every route and asserts zero console errors is available:

```bash
pnpm test:smoke     # requires playwright-core + a Chromium binary
```

---

## 🌐 Deployment guide

Riyaz is a standard Next.js 15 app and deploys anywhere Next runs. **HTTPS is required** for service
workers (all hosts below provide it).

**Vercel (recommended)**

1. Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset **Next.js** is auto‑detected — no env vars needed.
3. Deploy. The manifest + service worker are served from `/`.

**Netlify** — use the official Next.js runtime (`@netlify/plugin-nextjs`); build `pnpm build`.

**Docker / Node** — `pnpm build && pnpm start` behind any reverse proxy terminating TLS.

**Static export** — the app is client‑only and can also be exported (`output: "export"`) and hosted
on any static host/CDN; the `/playlists/[id]` route would then need `generateStaticParams` or a
catch‑all client route.

---

## ♿ Accessibility & performance

- WCAG‑minded: semantic landmarks, ARIA labels on icon buttons, visible focus rings, full keyboard
  operation, and a **Reduce motion** preference.
- Performance: static prerendering, `optimizePackageImports` for `lucide-react`/`date-fns`, lazy
  `import()` for jsPDF, cached waveform peaks (decode once, reuse forever), light metadata table,
  throttled time events, and an instant‑loading precached shell.

---

## 🔭 Future improvements

- True virtualised lists for very large libraries (e.g. `@tanstack/virtual`).
- Web Worker offload for waveform peak generation on huge lossless files.
- ID3 / metadata tag parsing for artist/album/artwork on import.
- A full undo/redo stack (today: undo on destructive deletes).
- M3U / iTunes playlist import, cross‑device sync via an optional backend, and a metronome/tuner.
- Phase‑vocoder time‑stretch for extreme slow‑downs with even higher fidelity.

---

<div align="center">

Built with care for everyone who gets better one loop at a time. 🎶

</div>
