/** Runtime audio engine + player types (not persisted). */

export type RepeatMode = "off" | "one" | "all";

export interface PlaybackState {
  /** Whether a track is currently loaded into the engine. */
  ready: boolean;
  playing: boolean;
  /** Current playback position in seconds. */
  position: number;
  /** Total duration of the loaded track in seconds. */
  duration: number;
  /** 0..1 */
  volume: number;
  muted: boolean;
  /** Playback rate, e.g. 0.5, 1, 1.5. */
  speed: number;
  /** Whether pitch is preserved while changing speed. */
  preservePitch: boolean;
  /** Buffered fraction 0..1 for the seek bar buffer hint. */
  buffered: number;
}

export interface LoopRegion {
  start: number;
  end: number;
  /** Number of times the active loop has wrapped this session. */
  count: number;
  /** Originating preset id, if the loop came from a saved preset. */
  presetId?: string;
}

/** Discriminated set of events the engine emits to subscribers. */
export type AudioEngineEvent =
  | { type: "ready"; duration: number }
  | { type: "play" }
  | { type: "pause" }
  | { type: "stop" }
  | { type: "ended" }
  | { type: "time"; position: number; duration: number }
  | { type: "loop"; count: number }
  | { type: "buffer"; buffered: number }
  | { type: "volume"; volume: number; muted: boolean }
  | { type: "speed"; speed: number }
  | { type: "error"; message: string };

export type AudioEngineListener = (event: AudioEngineEvent) => void;

export const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
