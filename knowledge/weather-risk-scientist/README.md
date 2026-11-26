# Knowledge — `weather-risk-scientist`

NWS flood/wind threat levels, rip-current link-out (D2), king tides, scoring.

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [nws-flood-and-wind-threat-levels.md](docs/nws-flood-and-wind-threat-levels.md) | NWS threat levels — flash flood and wind (Florida) | www.weather.gov, www.wpc.ncep.noaa.gov |
| [nws-rip-currents-and-king-tides.md](docs/nws-rip-currents-and-king-tides.md) | Rip currents (link-out only, D2) and king tides | forecast.weather.gov, www.miami.gov, www.miamidade.gov, www.weather.gov |

## examples/ (worked examples)

- [`01-flood-score.mjs`](examples/01-flood-score.mjs) — Example 1 — Flood score: pure function, one THRESHOLDS object, reasons, real-data check.
- [`02-outage-score.mjs`](examples/02-outage-score.mjs) — Example 2 — Power-outage likelihood with table-driven cases.
- [`03-risk-wording.md`](examples/03-risk-wording.md) — Example 3 — Risk wording that is honest and useful

**Run (from `examples/`):** `node 01-flood-score.mjs` · `node 02-outage-score.mjs`

All code examples were run and passed on 2026-11-26. Re-run everything with
`cd knowledge && npm install && npm run verify`.
