"use client";

import { create } from "zustand";
import { getAudioEngine } from "@/lib/audio/engine";
import { PracticeTracker } from "@/lib/audio/practice-tracker";
import { getDeviceLabel, isOnline } from "@/lib/device";
import { PLAYBACK_SPEEDS } from "@/types";
import type { AudioEngineEvent, LoopRegion, PlaybackState, RepeatMode, Song } from "@/types";
import { getAudioObjectUrl, incrementLoopPlay } from "@/services";
import { startSession } from "@/services/sessions";

const tracker = new PracticeTracker();

// Module-scoped, non-reactive handles.
let tickInterval: ReturnType<typeof setInterval> | null = null;
let sleepTimeout: ReturnType<typeof setTimeout> | null = null;
let currentObjectUrl: string | null = null;
let attached = false;
let flushCounter = 0;

const initialPlayback: PlaybackState = {
  ready: false,
  playing: false,
  position: 0,
  duration: 0,
  volume: 0.9,
  muted: false,
  speed: 1,
  preservePitch: true,
  buffered: 0,
};

export interface PlayerState {
  queue: Song[];
  shuffledQueue: Song[] | null;
  currentIndex: number;
  currentSong: Song | null;
  playback: PlaybackState;
  repeat: RepeatMode;
  shuffle: boolean;
  loopRegion: LoopRegion | null;
  loopEnabled: boolean;
  activeLoopPresetId: string | null;
  sleepEndsAt: number | null;
  sessionId: string | null;
  loadingSongId: string | null;

  attach: () => void;
  detach: () => void;
  configure: (opts: { volume?: number; speed?: number; preservePitch?: boolean }) => void;

  loadQueue: (songs: Song[], startIndex: number, autoplay?: boolean) => Promise<void>;
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  playAt: (index: number, autoplay?: boolean) => Promise<void>;

  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  next: (auto?: boolean) => Promise<void>;
  previous: () => Promise<void>;
  seek: (seconds: number) => void;
  seekBy: (delta: number) => void;

  setVolume: (volume: number) => void;
  nudgeVolume: (delta: number) => void;
  toggleMute: () => void;

  setSpeed: (speed: number) => void;
  nudgeSpeed: (direction: 1 | -1) => void;
  resetSpeed: () => void;
  setPreservePitch: (value: boolean) => void;

  setLoopStart: (seconds?: number) => void;
  setLoopEnd: (seconds?: number) => void;
  setLoopRegion: (start: number, end: number, presetId?: string) => void;
  toggleLoop: () => void;
  clearLoop: () => void;

  toggleShuffle: () => void;
  cycleRepeat: () => void;

  setSleepTimer: (minutes: number | null) => void;

  enqueueNext: (song: Song) => void;
  addToQueue: (song: Song) => void;

  _handleEvent: (event: AudioEngineEvent) => void;
  _tick: () => void;
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  shuffledQueue: null,
  currentIndex: -1,
  currentSong: null,
  playback: initialPlayback,
  repeat: "off",
  shuffle: false,
  loopRegion: null,
  loopEnabled: false,
  activeLoopPresetId: null,
  sleepEndsAt: null,
  sessionId: null,
  loadingSongId: null,

  attach() {
    if (attached || typeof window === "undefined") return;
    attached = true;
    const engine = getAudioEngine();
    engine.subscribe((event) => get()._handleEvent(event));

    if ("mediaSession" in navigator) {
      const ms = navigator.mediaSession;
      ms.setActionHandler("play", () => get().play());
      ms.setActionHandler("pause", () => get().pause());
      ms.setActionHandler("nexttrack", () => get().next());
      ms.setActionHandler("previoustrack", () => get().previous());
      ms.setActionHandler("seekbackward", () => get().seekBy(-5));
      ms.setActionHandler("seekforward", () => get().seekBy(5));
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) void tracker.flush(Date.now());
      });
      window.addEventListener("pagehide", () => void tracker.flush(Date.now()));
    }
  },

  detach() {
    if (tickInterval) clearInterval(tickInterval);
    if (sleepTimeout) clearTimeout(sleepTimeout);
    tickInterval = null;
    sleepTimeout = null;
    void tracker.endSong(Date.now());
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
    attached = false;
  },

  configure({ volume, speed, preservePitch }) {
    const engine = getAudioEngine();
    if (volume != null) engine.setVolume(volume);
    if (speed != null) engine.setSpeed(speed);
    if (preservePitch != null) engine.setPreservePitch(preservePitch);
    set((state) => ({
      playback: {
        ...state.playback,
        volume: volume ?? state.playback.volume,
        speed: speed ?? state.playback.speed,
        preservePitch: preservePitch ?? state.playback.preservePitch,
      },
    }));
  },

  async loadQueue(songs, startIndex, autoplay = true) {
    if (songs.length === 0) return;
    set({ queue: songs, shuffledQueue: get().shuffle ? shuffleArray(songs) : null });
    const index = get().shuffle ? 0 : Math.max(0, Math.min(startIndex, songs.length - 1));
    await get().playAt(index, autoplay);
  },

  async playSong(song, queue) {
    const list = queue ?? get().queue;
    const existingIndex = list.findIndex((s) => s.id === song.id);
    if (queue || existingIndex === -1) {
      const nextQueue = queue ?? [song];
      const idx = nextQueue.findIndex((s) => s.id === song.id);
      await get().loadQueue(nextQueue, idx === -1 ? 0 : idx, true);
    } else {
      await get().playAt(existingIndex, true);
    }
  },

  async playAt(index, autoplay = true) {
    const state = get();
    const list = state.shuffledQueue ?? state.queue;
    const song = list[index];
    if (!song) return;

    set({ loadingSongId: song.id });
    const engine = getAudioEngine();
    const url = await getAudioObjectUrl(song.id);
    if (!url) {
      set({ loadingSongId: null });
      return;
    }
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = url;

    await engine.load(url);
    engine.setSpeed(state.playback.speed);
    engine.setVolume(state.playback.volume);
    engine.setMuted(state.playback.muted);
    engine.setLoop(null);

    // Ensure a practice session exists for this listening block.
    let sessionId = state.sessionId;
    if (!sessionId) {
      const session = await startSession(Date.now());
      sessionId = session.id;
    }

    await tracker.startSong(
      {
        songId: song.id,
        songTitle: song.title,
        songArtist: song.artist,
        speed: state.playback.speed,
        online: isOnline(),
        deviceLabel: getDeviceLabel(),
      },
      sessionId,
      Date.now(),
    );

    set({
      currentIndex: index,
      currentSong: song,
      sessionId,
      loopRegion: null,
      loopEnabled: false,
      activeLoopPresetId: null,
      loadingSongId: null,
      playback: { ...get().playback, ready: true, position: 0, duration: song.duration },
    });

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist || "Unknown artist",
        album: song.album || "Riyaz",
      });
    }

    if (autoplay) engine.play();
  },

  togglePlay() {
    const engine = getAudioEngine();
    if (engine.paused) get().play();
    else get().pause();
  },

  play() {
    if (!get().currentSong) {
      const list = get().shuffledQueue ?? get().queue;
      if (list.length > 0) {
        void get().playAt(0, true);
        return;
      }
    }
    getAudioEngine().play();
  },

  pause() {
    getAudioEngine().pause();
  },

  stop() {
    getAudioEngine().stop();
    void tracker.flush(Date.now());
  },

  async next(auto = false) {
    const state = get();
    const list = state.shuffledQueue ?? state.queue;
    if (list.length === 0) return;

    if (auto && state.repeat === "one") {
      getAudioEngine().seek(0);
      getAudioEngine().play();
      return;
    }

    const isLast = state.currentIndex >= list.length - 1;
    if (isLast && state.repeat !== "all") {
      if (auto) {
        getAudioEngine().pause();
        getAudioEngine().seek(0);
      } else {
        await get().playAt(0, true);
      }
      return;
    }
    const nextIndex = isLast ? 0 : state.currentIndex + 1;
    await get().playAt(nextIndex, true);
  },

  async previous() {
    const state = get();
    const engine = getAudioEngine();
    if (engine.currentTime > 3) {
      engine.seek(0);
      return;
    }
    const list = state.shuffledQueue ?? state.queue;
    if (list.length === 0) return;
    const prevIndex = state.currentIndex <= 0 ? list.length - 1 : state.currentIndex - 1;
    await get().playAt(prevIndex, true);
  },

  seek(seconds) {
    getAudioEngine().seek(seconds);
  },

  seekBy(delta) {
    getAudioEngine().seekBy(delta);
  },

  setVolume(volume) {
    getAudioEngine().setVolume(volume);
  },

  nudgeVolume(delta) {
    const next = Math.min(1, Math.max(0, get().playback.volume + delta));
    getAudioEngine().setVolume(next);
  },

  toggleMute() {
    getAudioEngine().toggleMute();
  },

  setSpeed(speed) {
    getAudioEngine().setSpeed(speed);
    tracker.setSpeed(speed);
    set((state) => ({ playback: { ...state.playback, speed } }));
  },

  nudgeSpeed(direction) {
    const current = get().playback.speed;
    const idx = PLAYBACK_SPEEDS.reduce(
      (closest, value, i) =>
        Math.abs(value - current) < Math.abs(PLAYBACK_SPEEDS[closest] - current) ? i : closest,
      0,
    );
    const nextIdx = Math.min(PLAYBACK_SPEEDS.length - 1, Math.max(0, idx + direction));
    get().setSpeed(PLAYBACK_SPEEDS[nextIdx]);
  },

  resetSpeed() {
    get().setSpeed(1);
  },

  setPreservePitch(value) {
    getAudioEngine().setPreservePitch(value);
    set((state) => ({ playback: { ...state.playback, preservePitch: value } }));
  },

  setLoopStart(seconds) {
    const engine = getAudioEngine();
    const start = seconds ?? engine.currentTime;
    const region = get().loopRegion;
    const end = region && region.end > start ? region.end : Math.min(engine.duration, start + 8);
    get().setLoopRegion(start, end);
  },

  setLoopEnd(seconds) {
    const engine = getAudioEngine();
    const end = seconds ?? engine.currentTime;
    const region = get().loopRegion;
    const start = region && region.start < end ? region.start : Math.max(0, end - 8);
    get().setLoopRegion(start, end);
  },

  setLoopRegion(start, end, presetId) {
    if (end <= start) return;
    const engine = getAudioEngine();
    engine.setLoop({ start, end, presetId });
    if (presetId) void incrementLoopPlay(presetId, Date.now());
    set({
      loopRegion: { start, end, count: 0, presetId },
      loopEnabled: true,
      activeLoopPresetId: presetId ?? null,
    });
  },

  toggleLoop() {
    const state = get();
    const engine = getAudioEngine();
    if (state.loopEnabled) {
      engine.setLoop(null);
      set({ loopEnabled: false });
    } else if (state.loopRegion) {
      engine.setLoop({ start: state.loopRegion.start, end: state.loopRegion.end });
      set({ loopEnabled: true });
    } else {
      // Create a default loop around the current position.
      const start = Math.max(0, engine.currentTime - 4);
      get().setLoopRegion(start, Math.min(engine.duration, start + 8));
    }
  },

  clearLoop() {
    getAudioEngine().setLoop(null);
    set({ loopRegion: null, loopEnabled: false, activeLoopPresetId: null });
  },

  toggleShuffle() {
    const state = get();
    if (!state.shuffle) {
      const current = state.currentSong;
      const rest = state.queue.filter((s) => s.id !== current?.id);
      const shuffled = current ? [current, ...shuffleArray(rest)] : shuffleArray(state.queue);
      set({ shuffle: true, shuffledQueue: shuffled, currentIndex: current ? 0 : state.currentIndex });
    } else {
      const current = state.currentSong;
      const index = current ? state.queue.findIndex((s) => s.id === current.id) : state.currentIndex;
      set({ shuffle: false, shuffledQueue: null, currentIndex: Math.max(0, index) });
    }
  },

  cycleRepeat() {
    const order: RepeatMode[] = ["off", "all", "one"];
    const current = order.indexOf(get().repeat);
    set({ repeat: order[(current + 1) % order.length] });
  },

  setSleepTimer(minutes) {
    if (sleepTimeout) clearTimeout(sleepTimeout);
    if (minutes == null) {
      set({ sleepEndsAt: null });
      return;
    }
    const endsAt = Date.now() + minutes * 60_000;
    sleepTimeout = setTimeout(() => {
      get().pause();
      set({ sleepEndsAt: null });
    }, minutes * 60_000);
    set({ sleepEndsAt: endsAt });
  },

  enqueueNext(song) {
    set((state) => {
      const queue = state.queue.slice();
      queue.splice(state.currentIndex + 1, 0, song);
      return { queue };
    });
  },

  addToQueue(song) {
    set((state) => ({ queue: [...state.queue, song] }));
  },

  _handleEvent(event) {
    switch (event.type) {
      case "ready":
        set((state) => ({ playback: { ...state.playback, ready: true, duration: event.duration } }));
        break;
      case "play":
        set((state) => ({ playback: { ...state.playback, playing: true } }));
        tracker.resume(Date.now());
        if (!tickInterval) tickInterval = setInterval(() => get()._tick(), 1000);
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
        break;
      case "pause":
        set((state) => ({ playback: { ...state.playback, playing: false } }));
        tracker.pause(Date.now());
        void tracker.flush(Date.now());
        if (tickInterval) {
          clearInterval(tickInterval);
          tickInterval = null;
        }
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
        break;
      case "ended":
        void get().next(true);
        break;
      case "time":
        set((state) => ({
          playback: { ...state.playback, position: event.position, duration: event.duration || state.playback.duration },
        }));
        break;
      case "loop":
        tracker.addLoop();
        set((state) => ({ loopRegion: state.loopRegion ? { ...state.loopRegion, count: event.count } : null }));
        break;
      case "buffer":
        set((state) => ({ playback: { ...state.playback, buffered: event.buffered } }));
        break;
      case "volume":
        set((state) => ({ playback: { ...state.playback, volume: event.volume, muted: event.muted } }));
        break;
      case "speed":
        set((state) => ({ playback: { ...state.playback, speed: event.speed } }));
        break;
      case "error":
        // Surface via console; UI toasts are wired at the call sites.
        console.warn("[audio]", event.message);
        break;
    }
  },

  _tick() {
    const now = Date.now();
    tracker.tick(now);
    flushCounter += 1;
    if (flushCounter % 5 === 0) void tracker.flush(now);
  },
}));
