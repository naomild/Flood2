// Tiny static server for the PWA demo app (used by playwright.config.mjs webServer).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const ROOT = new URL("../../pwa-mobile-engineer/examples/demo-app/", import.meta.url).pathname;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png" };
createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  const file = normalize(join(ROOT, path === "/" ? "index.html" : path));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try { const b = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
}).listen(Number(process.env.PORT ?? 4173), "127.0.0.1");
