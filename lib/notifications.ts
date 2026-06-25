/** Thin wrapper over the Notifications API for practice reminders + goals. */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notificationsGranted(): boolean {
  return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  if (!notificationsGranted()) return;
  try {
    new Notification(title, { icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", ...options });
  } catch {
    /* Some browsers require notifications to come from the SW — ignore failures. */
  }
}
