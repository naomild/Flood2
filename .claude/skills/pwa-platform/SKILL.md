---
name: pwa-platform
description: "Manifest, service worker, offline data and install flows for iPhone and Android. Use when touching manifest.webmanifest, sw.js, caching or install UX."
user-invocable: false
---
# PWA platform

Full detail: `docs/02-pwa-installability.md`.

## Installable
Manifest with `name`/`short_name`, 192 and 512 px icons (+ maskable), `start_url`,
`display: standalone`, `id`, colours; served over HTTPS; linked from every page.
iOS also needs `apple-touch-icon` (180 px). Never `user-scalable=no`.

## Install UX
- Android/Chromium: keep `beforeinstallprompt`, show our own Install button.
- iPhone: no prompt event; if iOS and not `navigator.standalone`, show a one-time
  "Share → Add to Home Screen" hint. Push only works after install (iOS 16.4+).

## Service worker
- Shell: precache, versioned cache name, delete old caches on `activate`.
- Open-Meteo JSON: network-first, ~4 s timeout, then cache; keep the fetch time.
- `/api/*`: network only, never cached.
- `sw.js` served with `Cache-Control: no-cache`.

## Offline is a core feature
The user's power goes out. Opening the app offline must show the last forecast with a
clear "Last updated … — offline" banner. iOS may evict storage after ~7 days unused:
always re-fetch on launch and survive an empty cache.
