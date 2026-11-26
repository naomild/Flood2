// Proves the demo app is installable and works offline, in real Chromium.
// Run: node verify-pwa.mjs   (uses the preinstalled `playwright` package; no network needed)
// Checks: manifest members MDN lists as required · icon files really are 192/512 px ·
// Chromium reports no installability errors (CDP Page.getInstallabilityErrors) ·
// service worker controls the page · weather JSON is served from cache with "Offline" when offline ·
// /api/* is never cached.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = new URL("./demo-app/", import.meta.url).pathname;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png" };

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  if (path.startsWith("/api/")) { res.writeHead(200, { "content-type": "application/json" }); return res.end('{"private":true}'); }
  const file = normalize(join(ROOT, path === "/" ? "index.html" : path));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-cache" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://localhost:${server.address().port}`; // localhost counts as a secure context

// 1. Manifest members (MDN "Making PWAs installable")
const manifest = JSON.parse(await readFile(join(ROOT, "manifest.webmanifest"), "utf8"));
assert.ok(manifest.name || manifest.short_name);
assert.ok(manifest.start_url && (manifest.display || manifest.display_override));
assert.notEqual(manifest.prefer_related_applications, true);
for (const size of [192, 512]) {
  const icon = manifest.icons.find((i) => i.sizes === `${size}x${size}`);
  assert.ok(icon, `${size}px icon listed`);
  const png = await readFile(join(ROOT, icon.src));
  assert.equal(png.readUInt32BE(16), size, `${icon.src} width`);
  assert.equal(png.readUInt32BE(20), size, `${icon.src} height`);
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(base + "/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();                                   // now controlled by the SW
  assert.ok(await page.evaluate(() => !!navigator.serviceWorker.controller), "SW controls the page");
  await page.getByText(/^Updated /).waitFor();

  // 2. Chromium's own installability check
  const cdp = await context.newCDPSession(page);
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
  assert.deepEqual(installabilityErrors, [], JSON.stringify(installabilityErrors));

  // 3. Caches: shell + weather data present
  const keys = await page.evaluate(() => caches.keys());
  assert.ok(keys.includes("shell-v1") && keys.includes("weather-data"), keys.join(","));

  // 4. Offline: reload still shows the forecast, labelled as offline
  await context.setOffline(true);
  await page.reload();
  await page.getByText(/^Offline · Updated /).waitFor();
  const today = await page.locator("#today").textContent();
  assert.match(today, /17\.2 in of rain expected \(100% chance\)/);

  // 5. /api/* is network-only: offline it fails instead of returning a cached copy
  const apiOffline = await page.evaluate(() => fetch("/api/agents").then(() => "served", () => "failed"));
  assert.equal(apiOffline, "failed");
  const apiCached = await page.evaluate(async () => {
    for (const k of await caches.keys()) if (await (await caches.open(k)).match("/api/agents")) return true;
    return false;
  });
  assert.equal(apiCached, false);

  console.log("verify-pwa: manifest ok · icons 192/512 ok · Chromium installability errors: none ·",
    "SW controls page · offline shows:", JSON.stringify(await page.locator("#status").textContent()));
} finally {
  await browser.close();
  server.close();
}
