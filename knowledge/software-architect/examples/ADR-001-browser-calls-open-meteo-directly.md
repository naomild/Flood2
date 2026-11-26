# ADR 1: Browser calls Open-Meteo directly

**Status:** Accepted (2026-11-26)

## Context
Flood shows forecasts from Open-Meteo, which needs no API key, is free for non-commercial use under
10,000 calls/day, and updates its models hourly to 6-hourly (open-meteo.com/en/docs). The app runs
on the Netlify Free plan (D4), where every function invocation uses plan credits, and must work
offline after a power cut. Netlify custom headers don't apply to function responses, so a proxy
function would also have to set its own caching headers. A server-side proxy could cache responses
for all users and hide the provider, but adds latency, a failure point and function usage.

## Decision
We will fetch forecast and marine data from the browser directly
(`api.open-meteo.com`, `marine-api.open-meteo.com`), cache responses in the service worker
(network-first, 4 s timeout), and allow those two hosts in the CSP `connect-src`. No function sits
in the weather path.

## Consequences
- Positive: zero function cost for the public app; one fewer moving part; offline works from the
  device cache; data age is visible.
- Negative: each device counts toward Open-Meteo's daily call limit; we can't change providers
  without shipping new front-end code; the CSP must list the two hosts.
- Neutral: if traffic grows near 10,000 calls/day, revisit with a caching proxy function backed by
  Blobs (would supersede this ADR).
