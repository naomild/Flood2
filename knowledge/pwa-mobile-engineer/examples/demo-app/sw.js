// Flood service worker: shell cache-first, weather network-first (with timeout), /api/* network-only.
// Patterns: MDN "Using Service Workers", web.dev "Learn PWA: Serving".
const VERSION = "v1";                       // bump on every deploy that changes the shell
const SHELL = `shell-${VERSION}`;
const DATA = "weather-data";                // kept across versions: last forecast must survive updates
const SHELL_FILES = ["/", "/index.html", "/app.js", "/styles.css", "/manifest.webmanifest", "/icons/icon-192.png"];
const TIMEOUT_MS = 4000;

const isWeather = (url) => url.hostname.endsWith("open-meteo.com") || url.pathname.startsWith("/mock-open-meteo/");

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL, DATA];
    for (const key of await caches.keys()) if (!keep.includes(key)) await caches.delete(key);
    await self.clients.claim();
  })());
});

async function networkFirstWithTimeout(request) {
  const cache = await caches.open(DATA);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(request, { signal: controller.signal });
    if (res.ok) {
      // Store a copy stamped with its fetch time so the page can show the data's age offline.
      const headers = new Headers(res.headers);
      headers.set("x-flood-fetched-at", String(Date.now()));
      const body = await res.clone().arrayBuffer();
      await cache.put(request, new Response(body, { status: 200, headers }));
    }
    return res;
  } catch {
    const cached = await cache.match(request);
    if (!cached) return Response.error();
    const headers = new Headers(cached.headers);
    headers.set("x-flood-source", "cache");
    return new Response(await cached.arrayBuffer(), { status: 200, headers });
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;               // let POSTs (e.g. /api/chat) pass through
  if (url.pathname.startsWith("/api/")) return;             // network only, never cached (private data)
  if (isWeather(url)) { event.respondWith(networkFirstWithTimeout(event.request)); return; }
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(event.request, { ignoreSearch: url.pathname === "/" })
      .then((hit) => hit || fetch(event.request)));          // cache first for the shell
  }
});
