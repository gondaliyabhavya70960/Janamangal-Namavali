/**
 * Collision-resistant id generation. Uses the platform `crypto.randomUUID`
 * when available and degrades gracefully so the module also works in the
 * service worker / older runtimes.
 */
export function createId(prefix?: string): string {
  let raw: string;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    raw = crypto.randomUUID();
  } else if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    raw = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    raw = `${performance.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  }
  return prefix ? `${prefix}_${raw}` : raw;
}
