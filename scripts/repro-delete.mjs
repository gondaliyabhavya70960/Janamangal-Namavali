import { chromium } from "playwright-core";

const EXECUTABLE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = process.env.BASE || "http://localhost:3100";

// Minimal valid WAV (0.3s, 8kHz mono 16-bit, 440Hz tone).
function makeWav() {
  const sampleRate = 8000,
    seconds = 0.3,
    n = Math.floor(sampleRate * seconds);
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 8000), i * 2);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const errors = [];
const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true });
const page = await browser.newPage();
page.on("console", (m) => m.type() === "error" && errors.push(`[console] ${m.text()}`));
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

const countSongs = () =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const req = indexedDB.open("riyaz");
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("songs")) return resolve(-1);
          const tx = db.transaction("songs", "readonly").objectStore("songs").count();
          tx.onsuccess = () => resolve(tx.result);
          tx.onerror = () => resolve(-2);
        };
        req.onerror = () => resolve(-3);
      }),
  );

const upload = async (name) => {
  await page.setInputFiles('input[type="file"]', { name, mimeType: "audio/wav", buffer: makeWav() });
  await page.waitForTimeout(2200);
};
const libRows = (title) => page.locator("main").getByText(title, { exact: false }).count();
const deleteFirstRow = async () => {
  await page.locator('button[aria-label="More options"]').first().click();
  await page.waitForTimeout(300);
  await page.getByText("Delete from library").first().click();
  await page.waitForTimeout(1500);
};

await page.goto(BASE + "/library", { waitUntil: "networkidle" });

// --- Scenario 1: delete WITHOUT playing (isolates list/live-query refresh) ---
await upload("Alpha Track.wav");
console.log("S1 after upload — DB:", await countSongs(), "| lib rows:", await libRows("Alpha Track"));
await deleteFirstRow();
const s1Db = await countSongs();
const s1Rows = await libRows("Alpha Track");
console.log("S1 after delete — DB:", s1Db, "| lib rows still showing:", s1Rows);

// --- Scenario 2: delete WHILE playing (tests player cleanup) ---
await upload("Beta Track.wav");
await page.locator('button[aria-label="Play Beta Track"]').first().click().catch(() => {});
await page.waitForTimeout(800);
await deleteFirstRow();
const s2Db = await countSongs();
const s2Rows = await libRows("Beta Track");
const s2Player = await page.locator('div.glass').getByText("Beta Track", { exact: false }).count();
console.log("S2 after delete — DB:", s2Db, "| lib rows:", s2Rows, "| player still shows:", s2Player);

await browser.close();
console.log("\nconsole/page errors:", errors.length);
errors.slice(0, 10).forEach((e) => console.log("  " + e));

const listOk = s1Db === 0 && s1Rows === 0;
const playerOk = s2Db === 0 && s2Rows === 0 && s2Player === 0;
console.log(`\nLIST refresh on delete: ${listOk ? "OK ✓" : "BROKEN ✗"}`);
console.log(`PLAYER cleanup on delete: ${playerOk ? "OK ✓" : "BROKEN ✗"}`);
process.exit(listOk && playerOk ? 0 : 1);
