import { beginPlay, commitPlayDelta, endPlay, type BeginPlayContext } from "@/services/history";

/**
 * Measures *actual listening time* and persists it to the analytics tables.
 *
 * Correctness rules:
 * - Time only accrues while audio is genuinely playing. `tick()` is called on an
 *   interval that the player store starts on `play` and stops on `pause`.
 * - Each tick adds real wall-clock elapsed (capped so a suspended/back-grounded
 *   tab can't inject a huge jump when it resumes).
 * - Deltas are flushed to IndexedDB periodically and on every lifecycle edge
 *   (pause, track change, tab hidden, unload) so a crash loses at most a few
 *   seconds.
 */
const MAX_TICK_MS = 2000;

export class PracticeTracker {
  private historyId: string | null = null;
  private songId: string | null = null;
  private sessionId: string | null = null;
  private lastTickAt: number | null = null;
  private pendingMs = 0;
  private pendingLoops = 0;
  private pendingPausedMs = 0;
  private speed = 1;
  private starting: Promise<void> | null = null;

  /** Begin tracking a new song play, flushing any previous one first. */
  async startSong(ctx: BeginPlayContext, sessionId: string | null, now: number): Promise<void> {
    await this.endSong(now);
    this.songId = ctx.songId;
    this.sessionId = sessionId;
    this.speed = ctx.speed;
    this.lastTickAt = null;
    this.pendingMs = 0;
    this.pendingLoops = 0;
    this.pendingPausedMs = 0;
    this.starting = beginPlay(ctx, now).then((id) => {
      this.historyId = id;
    });
    await this.starting;
  }

  /** Called when playback resumes — anchors the wall clock. */
  resume(now: number) {
    this.lastTickAt = now;
  }

  /** Called on an interval while playing to accrue listening time. */
  tick(now: number) {
    if (this.lastTickAt != null) {
      const delta = Math.min(now - this.lastTickAt, MAX_TICK_MS);
      if (delta > 0) this.pendingMs += delta;
    }
    this.lastTickAt = now;
  }

  /** Called when playback pauses — accrues the final slice and stops the clock. */
  pause(now: number) {
    this.tick(now);
    this.lastTickAt = null;
  }

  addLoop() {
    this.pendingLoops += 1;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  addPausedMs(ms: number) {
    this.pendingPausedMs += ms;
  }

  /** Persist accrued listening time. Safe to call frequently. */
  async flush(now: number): Promise<void> {
    if (this.starting) await this.starting;
    if (!this.historyId || !this.songId) return;
    if (this.pendingMs <= 0 && this.pendingLoops === 0 && this.pendingPausedMs === 0) return;
    const deltaMs = this.pendingMs;
    const addLoops = this.pendingLoops;
    const pausedMs = this.pendingPausedMs;
    this.pendingMs = 0;
    this.pendingLoops = 0;
    this.pendingPausedMs = 0;
    await commitPlayDelta(
      this.historyId,
      this.songId,
      { deltaMs, addLoops, pausedMs, speed: this.speed, sessionId: this.sessionId ?? undefined },
      now,
    );
  }

  /** Finalise the current song play. */
  async endSong(now: number): Promise<void> {
    if (!this.historyId) return;
    this.pause(now);
    await this.flush(now);
    const id = this.historyId;
    this.historyId = null;
    this.songId = null;
    this.lastTickAt = null;
    await endPlay(id, now);
  }

  get activeSongId() {
    return this.songId;
  }
}
