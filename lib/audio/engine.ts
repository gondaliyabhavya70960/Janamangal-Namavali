import type { AudioEngineEvent, AudioEngineListener, LoopRegion } from "@/types";
import { clamp } from "@/lib/utils";

/**
 * The single audio engine for the whole app.
 *
 * Architectural decision: we own a native `HTMLAudioElement` rather than routing
 * through Howler/Web-Audio buffers. Only the media element exposes
 * `preservesPitch`, which is essential for a *practice* tool — slowing a passage
 * to 0.5× must not drop it an octave. WaveSurfer attaches to this very element
 * (`WaveSurfer.create({ media })`) so visualisation and playback never drift.
 *
 * Loop enforcement runs on both `requestAnimationFrame` (smooth while visible)
 * and `timeupdate` (keeps working in a backgrounded tab), de-duplicated by a
 * short cooldown so a single wrap is only ever counted once.
 */
export class AudioEngine {
  readonly media: HTMLAudioElement;
  private listeners = new Set<AudioEngineListener>();
  private loop: LoopRegion | null = null;
  private rafId: number | null = null;
  private lastLoopWrapAt = 0;
  private lastEmittedTime = 0;
  private _preservePitch = true;
  private _speed = 1;

  constructor() {
    const media = typeof Audio !== "undefined" ? new Audio() : ({} as HTMLAudioElement);
    this.media = media;
    if (typeof Audio === "undefined") return;

    media.preload = "auto";
    media.setAttribute("playsinline", "true");
    this.applyPreservePitch();

    media.addEventListener("loadedmetadata", () => this.emit({ type: "ready", duration: media.duration || 0 }));
    media.addEventListener("durationchange", () =>
      this.emit({ type: "time", position: media.currentTime, duration: media.duration || 0 }),
    );
    media.addEventListener("play", () => {
      this.startRaf();
      this.emit({ type: "play" });
    });
    media.addEventListener("pause", () => {
      this.stopRaf();
      this.emit({ type: "pause" });
    });
    media.addEventListener("ended", () => {
      this.stopRaf();
      this.emit({ type: "ended" });
    });
    media.addEventListener("timeupdate", () => {
      this.enforceLoop();
      this.emitTime();
    });
    media.addEventListener("progress", () => this.emit({ type: "buffer", buffered: this.bufferedFraction() }));
    media.addEventListener("volumechange", () =>
      this.emit({ type: "volume", volume: media.volume, muted: media.muted }),
    );
    media.addEventListener("ratechange", () => this.emit({ type: "speed", speed: media.playbackRate }));
    media.addEventListener("error", () =>
      this.emit({ type: "error", message: media.error?.message || "Playback error" }),
    );
  }

  // ---- subscription ----
  subscribe(listener: AudioEngineListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: AudioEngineEvent) {
    this.listeners.forEach((l) => l(event));
  }

  private emitTime() {
    const now = performance.now();
    // Throttle to ~12fps for the store; the rAF loop handles smoothness elsewhere.
    if (now - this.lastEmittedTime < 80) return;
    this.lastEmittedTime = now;
    this.emit({ type: "time", position: this.media.currentTime, duration: this.media.duration || 0 });
  }

  // ---- source ----
  async load(url: string): Promise<void> {
    this.media.src = url;
    this.media.load();
  }

  // ---- transport ----
  async play(): Promise<void> {
    try {
      await this.media.play();
    } catch (error) {
      this.emit({ type: "error", message: error instanceof Error ? error.message : "Autoplay blocked" });
    }
  }

  pause() {
    this.media.pause();
  }

  stop() {
    this.media.pause();
    this.seek(this.loop?.start ?? 0);
    this.emit({ type: "stop" });
  }

  seek(seconds: number) {
    const duration = this.media.duration || 0;
    this.media.currentTime = clamp(seconds, 0, duration || seconds);
    this.emit({ type: "time", position: this.media.currentTime, duration });
  }

  seekBy(deltaSeconds: number) {
    this.seek(this.media.currentTime + deltaSeconds);
  }

  // ---- volume ----
  setVolume(volume: number) {
    this.media.volume = clamp(volume, 0, 1);
    if (this.media.volume > 0) this.media.muted = false;
  }

  setMuted(muted: boolean) {
    this.media.muted = muted;
  }

  toggleMute() {
    this.media.muted = !this.media.muted;
  }

  // ---- speed + pitch ----
  setSpeed(speed: number) {
    this._speed = clamp(speed, 0.25, 4);
    this.media.playbackRate = this._speed;
    this.applyPreservePitch();
  }

  get speed() {
    return this._speed;
  }

  setPreservePitch(preserve: boolean) {
    this._preservePitch = preserve;
    this.applyPreservePitch();
  }

  private applyPreservePitch() {
    const media = this.media as HTMLAudioElement & {
      mozPreservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    };
    media.preservesPitch = this._preservePitch;
    media.mozPreservesPitch = this._preservePitch;
    media.webkitPreservesPitch = this._preservePitch;
  }

  // ---- looping ----
  setLoop(region: { start: number; end: number; presetId?: string } | null) {
    if (!region || region.end <= region.start) {
      this.loop = null;
      return;
    }
    this.loop = { start: region.start, end: region.end, count: 0, presetId: region.presetId };
    if (this.media.currentTime < region.start || this.media.currentTime > region.end) {
      this.seek(region.start);
    }
  }

  getLoop(): LoopRegion | null {
    return this.loop;
  }

  private enforceLoop() {
    if (!this.loop) return;
    const { start, end } = this.loop;
    if (this.media.currentTime >= end) {
      const now = performance.now();
      if (now - this.lastLoopWrapAt > 150) {
        this.lastLoopWrapAt = now;
        this.loop.count += 1;
        this.emit({ type: "loop", count: this.loop.count });
      }
      this.media.currentTime = start;
    } else if (this.media.currentTime < start - 0.25) {
      this.media.currentTime = start;
    }
  }

  private bufferedFraction(): number {
    const { buffered, duration } = this.media;
    if (!duration || buffered.length === 0) return 0;
    return clamp(buffered.end(buffered.length - 1) / duration, 0, 1);
  }

  // ---- rAF loop for smooth time + tight loop wrap while visible ----
  private startRaf() {
    if (this.rafId != null) return;
    const tick = () => {
      this.enforceLoop();
      this.emit({ type: "time", position: this.media.currentTime, duration: this.media.duration || 0 });
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopRaf() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  get currentTime() {
    return this.media.currentTime;
  }

  get duration() {
    return this.media.duration || 0;
  }

  get paused() {
    return this.media.paused;
  }

  destroy() {
    this.stopRaf();
    this.listeners.clear();
    this.media.pause();
    this.media.removeAttribute("src");
    this.media.load();
  }
}

/** Lazily-created browser singleton shared by the player store and waveform. */
let engineSingleton: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (typeof window === "undefined") {
    throw new Error("AudioEngine is only available in the browser.");
  }
  if (!engineSingleton) engineSingleton = new AudioEngine();
  return engineSingleton;
}
