/**
 * Lightweight, fully-offline audio metadata extraction. We deliberately avoid
 * decoding the entire file on upload — duration is read from a throwaway
 * `<audio>` element, which is fast even for large lossless files. Full waveform
 * peaks are generated lazily by the player and cached back onto the song.
 */

/** Read the duration (seconds) of an audio blob without fully decoding it. */
export function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = url;

    const cleanup = () => {
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
    };

    const settle = (value: number) => {
      cleanup();
      resolve(Number.isFinite(value) && value > 0 ? value : 0);
    };

    audio.addEventListener("loadedmetadata", () => {
      // Some streamed containers (webm/ogg) report Infinity until seeked.
      if (audio.duration === Infinity) {
        audio.currentTime = 1e101;
        const onUpdate = () => {
          audio.removeEventListener("timeupdate", onUpdate);
          settle(audio.duration);
        };
        audio.addEventListener("timeupdate", onUpdate);
      } else {
        settle(audio.duration);
      }
    });
    audio.addEventListener("error", () => settle(0));
    // Safety timeout so a malformed file can never hang an upload.
    setTimeout(() => settle(audio.duration), 8000);
  });
}

/**
 * Decode `samples` normalised peaks (0..1) from an audio blob using an
 * OfflineAudioContext. Used to persist a fast-rendering waveform. Heavy for
 * very long files, so callers should treat it as a best-effort enhancement.
 */
export async function decodePeaks(blob: Blob, samples = 1000): Promise<number[]> {
  const Ctx: typeof OfflineAudioContext | undefined =
    (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  if (!Ctx) return [];
  const arrayBuffer = await blob.arrayBuffer();
  // A short offline context is enough to decode; length/sampleRate are nominal.
  const decoderCtx = new Ctx(1, 1, 44100);
  const audioBuffer = await decoderCtx.decodeAudioData(arrayBuffer);
  const channel = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channel.length / samples) || 1;
  const peaks: number[] = [];
  let max = 0;
  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    let peak = 0;
    for (let j = 0; j < blockSize; j++) {
      const value = Math.abs(channel[start + j] || 0);
      if (value > peak) peak = value;
    }
    peaks.push(peak);
    if (peak > max) max = peak;
  }
  // Normalise to 0..1 for resolution-independent rendering.
  return max > 0 ? peaks.map((p) => p / max) : peaks;
}
