# Knowledge — `open-meteo-integrator`

Open-Meteo forecast and marine endpoints, fields, units, time zones, caching.

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [open-meteo-forecast-api.md](docs/open-meteo-forecast-api.md) | Open-Meteo Forecast API | open-meteo.com |
| [open-meteo-marine-api.md](docs/open-meteo-marine-api.md) | Open-Meteo Marine API | open-meteo.com |

## examples/ (worked examples)

- [`01-build-urls.mjs`](examples/01-build-urls.mjs) — Example 1 — build Open-Meteo forecast and marine URLs the Flood way.
- [`02-parse-forecast.mjs`](examples/02-parse-forecast.mjs) — Example 2 — turn a real Open-Meteo response into Flood's per-day model.
- [`03-fetch-with-timeout.mjs`](examples/03-fetch-with-timeout.mjs) — Example 3 — fetch with a timeout and a cached fallback that reports its age.
- `fixtures/` — real Open-Meteo responses captured 2026-11-26 (Miami downpour, Miami Beach marine)

**Run (from `examples/`):** `node 01-build-urls.mjs` · `node 02-parse-forecast.mjs` · `node 03-fetch-with-timeout.mjs`

All code examples were run and passed on 2026-11-26. Re-run everything with
`cd knowledge && npm install && npm run verify`.
