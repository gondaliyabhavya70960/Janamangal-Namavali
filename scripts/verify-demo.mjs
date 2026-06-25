import { chromium } from "playwright-core";

const EXECUTABLE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = process.env.BASE || "http://localhost:3100";

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
          if (!db.objectStoreNames.contains("songs")) return resolve(0);
          const c = db.transaction("songs", "readonly").objectStore("songs").count();
          c.onsuccess = () => resolve(c.result);
          c.onerror = () => resolve(-1);
        };
        req.onerror = () => resolve(-1);
      }),
  );

// Fresh profile → empty library → demo should seed on first load.
await page.goto(BASE + "/library", { waitUntil: "networkidle" });
await page.getByText("Janmangal Namavali", { exact: false }).first().waitFor({ timeout: 15000 }).catch(() => {});
const demoVisible = (await page.locator("main").getByText("Janmangal Namavali", { exact: false }).count()) > 0;
const songCount = await countSongs();
console.log("demo row visible in library:", demoVisible);
console.log("songs seeded in IndexedDB:", songCount);

// Settings should have NO Google Drive UI anymore.
await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const settingsHtml = await page.content();
const hasDrive = /Google Drive|Back up to Drive|Save to Drive/i.test(settingsHtml);
console.log("settings still mentions Google Drive:", hasDrive);

await browser.close();
console.log("\nconsole/page errors:", errors.length);
errors.slice(0, 10).forEach((e) => console.log("  " + e));

const ok = demoVisible && songCount === 1 && !hasDrive && errors.length === 0;
console.log(ok ? "\nRESULT: demo seeded + Drive removed ✓" : "\nRESULT: problem ✗");
process.exit(ok ? 0 : 1);
