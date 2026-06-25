/**
 * Optional Google Drive backup — fully client-side, no backend.
 *
 * Uses Google Identity Services (GIS) token flow with the non-sensitive
 * `drive.file` scope (app can only see files it creates), so no OAuth app
 * verification is required. Enabled only when `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
 * is configured; otherwise the UI falls back to Save/Share-to-Drive.
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const FOLDER_NAME = "Riyaz Backups";

declare global {
  interface Window {
    google?: any;
  }
}

export function isDriveConfigured(): boolean {
  return typeof CLIENT_ID === "string" && CLIENT_ID.length > 0;
}

export interface DriveBackup {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;
let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Drive is browser-only"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google sign-in (are you offline?)."));
    document.head.appendChild(script);
  });
  return gisPromise;
}

/** Acquire an OAuth access token (cached for the session), prompting consent as needed. */
async function getAccessToken(): Promise<string> {
  if (!isDriveConfigured()) throw new Error("Google Drive is not configured.");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  await loadGis();

  return new Promise<string>((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response: { access_token?: string; expires_in?: number; error?: string }) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || "Google sign-in was cancelled."));
          return;
        }
        cachedToken = {
          token: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
        };
        resolve(response.access_token);
      },
    });
    client.requestAccessToken({ prompt: cachedToken ? "" : "consent" });
  });
}

async function driveFetch(url: string, token: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  if (!res.ok) {
    if (res.status === 401) cachedToken = null;
    throw new Error(`Google Drive error (${res.status}). Please try again.`);
  }
  return res;
}

async function ensureFolder(token: string): Promise<string> {
  const query = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const found = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)`,
    token,
  ).then((r) => r.json());
  if (found.files?.length) return found.files[0].id as string;

  const created = await driveFetch("https://www.googleapis.com/drive/v3/files", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  }).then((r) => r.json());
  return created.id as string;
}

/** Upload a backup (JSON text) to the Riyaz Backups folder in the user's Drive. */
export async function driveUploadBackup(backupText: string, fileName: string): Promise<void> {
  const token = await getAccessToken();
  const folderId = await ensureFolder(token);
  const boundary = `riyaz${Math.floor(Math.random() * 1e9).toString(36)}`;
  const metadata = { name: fileName, parents: [folderId], mimeType: "application/json" };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${backupText}\r\n` +
    `--${boundary}--`;
  await driveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", token, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
}

/** List previously-uploaded Riyaz backups, newest first. */
export async function driveListBackups(): Promise<DriveBackup[]> {
  const token = await getAccessToken();
  const folderId = await ensureFolder(token);
  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const result = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`,
    token,
  ).then((r) => r.json());
  return (result.files ?? []) as DriveBackup[];
}

/** Download a backup file's JSON text by id. */
export async function driveDownloadBackup(fileId: string): Promise<string> {
  const token = await getAccessToken();
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    token,
  );
  return res.text();
}
