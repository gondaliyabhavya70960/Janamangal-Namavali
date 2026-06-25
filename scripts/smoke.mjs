import { chromium } from "playwright-core";

const EXECUTABLE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = process.env.BASE || "http://localhost:3100";
const ROUTES = ["/", "/library", "/playlists", "/favorites", "/history", "/stats", "/settings"];

const errors = [];

const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true });
const page = await browser.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));

// Wait for server readiness.
for (let i = 0; i < 30; i++) {
  try {
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 2000 });
    if (res && res.ok()) break;
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(600);
  const heading = await page.locator("h1").first().textContent().catch(() => "(none)");
  console.log(`✓ ${route.padEnd(12)} → h1: ${heading?.trim().slice(0, 40)}`);
}

// Open the command palette to exercise an overlay + store interaction.
await page.goto(BASE, { waitUntil: "networkidle" });
await page.keyboard.press("Meta+k");
await page.waitForTimeout(400);
const paletteVisible = await page.locator("text=Search songs, jump to a page").count();
console.log(`✓ command palette opened: ${paletteVisible > 0}`);

await page.screenshot({ path: "scripts/.smoke-dashboard.png" });

await browser.close();

console.log(`\nConsole/page errors: ${errors.length}`);
errors.slice(0, 20).forEach((e) => console.log("  " + e));
process.exit(errors.length > 0 ? 1 : 0);
