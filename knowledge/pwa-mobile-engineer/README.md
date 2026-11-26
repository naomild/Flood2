# Knowledge — `pwa-mobile-engineer`

Manifest, service worker lifecycle and caching, install prompts on Android and iPhone.

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [mdn-installable-and-manifest.md](docs/mdn-installable-and-manifest.md) | Installability and the web app manifest (MDN) | developer.mozilla.org |
| [service-worker-lifecycle-and-caching.md](docs/service-worker-lifecycle-and-caching.md) | Service worker lifecycle and caching strategies | developer.mozilla.org, web.dev |
| [webdev-install-prompt.md](docs/webdev-install-prompt.md) | Install prompts — Android (beforeinstallprompt) and iPhone | developer.mozilla.org, web.dev, webkit.org |

## examples/ (worked examples)

- `demo-app/` — minimal installable PWA used by `verify-pwa.mjs` and the QA tests
- [`verify-pwa.mjs`](examples/verify-pwa.mjs) — Proves the demo app is installable and works offline, in real Chromium.

**Run (from `examples/`):** `node verify-pwa.mjs` (real Chromium: installability, service worker, offline)

All code examples were run and passed on 2026-11-26. Re-run everything with
`cd knowledge && npm install && npm run verify`.
