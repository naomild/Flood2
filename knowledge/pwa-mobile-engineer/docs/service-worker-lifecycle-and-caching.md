# Service worker lifecycle and caching strategies

Sources (read 2026-11-26):
- MDN, *Using Service Workers* — <https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers>
- web.dev, *Learn PWA: Serving* — <https://web.dev/learn/pwa/serving>

## Register (MDN)
```js
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      if (registration.installing) console.log("Service worker installing");
      else if (registration.waiting) console.log("Service worker installed");
      else if (registration.active) console.log("Service worker active");
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};
```

## Precache on install (MDN)
```js
const addResourcesToCache = async (resources) => {
  const cache = await caches.open("v1");
  await cache.addAll(resources);
};
self.addEventListener("install", (event) => {
  event.waitUntil(addResourcesToCache(["/", "/index.html", "/style.css", "/app.js"]));
});
```

## Delete old caches on activate (MDN)
```js
const deleteOldCaches = async () => {
  const cacheKeepList = ["v2"];
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
  await Promise.all(cachesToDelete.map((key) => caches.delete(key)));
};
self.addEventListener("activate", (event) => { event.waitUntil(deleteOldCaches()); });
```

`event.respondWith(...)` in the `fetch` handler supplies the response.

## Strategies (web.dev, quoted)
| Strategy | web.dev says | Flood uses it for |
|---|---|---|
| Cache first | "prioritizes performance over freshness" | App shell (HTML, CSS, JS, icons, `cities.json`) |
| Network first | "prioritizes updated content instead of performance" | Open-Meteo JSON (with a timeout — see example) |
| Stale while revalidate | "returns a cached response immediately, then checks the network for an update" | Not used for forecasts (would show old risk first) |
| Network only | "often useful for resources like online-only API requests" | `/api/*` (Agent Console) |
| Cache only | "requests never go to the network" | — |

Network first (web.dev):
```js
self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
```
Plain network-first only falls back when `fetch` *fails*. On a weak storm-time connection a
fetch can hang, so Flood adds a timeout (see `examples/sw.js`). Store a `clone()` of the
response, since a body can be read only once.
