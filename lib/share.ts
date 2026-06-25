import { downloadText } from "@/lib/utils";

/**
 * Save/Share a backup file. On devices that support the Web Share API with
 * files (most mobile browsers), this opens the native share sheet so the user
 * can drop the backup straight into the Google Drive app. Elsewhere it falls
 * back to a normal download the user can upload to Drive manually.
 */
export async function shareOrDownloadBackup(
  text: string,
  fileName: string,
): Promise<"shared" | "downloaded"> {
  const file = new File([text], fileName, { type: "application/json" });
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Riyaz backup", text: "Save your Riyaz backup to Google Drive" });
      return "shared";
    } catch {
      // User dismissed the sheet, or sharing failed — fall back to a download.
    }
  }
  downloadText(text, fileName);
  return "downloaded";
}
