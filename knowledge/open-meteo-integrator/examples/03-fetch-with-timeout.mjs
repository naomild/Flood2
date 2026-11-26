// Example 3 — fetch with a timeout and a cached fallback that reports its age.
// In the app the service worker does the caching; this module shows the same contract for the
// page (and for tests). Run: node 03-fetch-with-timeout.mjs  (fetch is mocked — no network)
// Why 15 min: Open-Meteo models update hourly to 6-hourly (https://open-meteo.com/en/docs).
import assert from "node:assert/strict";

export const FRESH_MS = 15 * 60 * 1000;

/**
 * @param {string} url
 * @param {{fetchImpl?: typeof fetch, cache: Map<string,{at:number,data:any}>, now?: () => number, timeoutMs?: number}} o
 * @returns {Promise<{data:any, source:"network"|"cache", fetchedAt:number}>}
 */
export async function getForecast(url, { fetchImpl = fetch, cache, now = Date.now, timeoutMs = 4000 }) {
  const cached = cache.get(url);
  if (cached && now() - cached.at < FRESH_MS) return { data: cached.data, source: "cache", fetchedAt: cached.at };
  // Explicit controller + timer (not AbortSignal.timeout(): in Node its timer is unref'd, so a hung
  // request can let the process exit mid-await — found by running this example).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    const body = await res.json();
    if (!res.ok || body.error) throw new Error(body.reason ?? `HTTP ${res.status}`);
    cache.set(url, { at: now(), data: body });
    return { data: body, source: "network", fetchedAt: now() };
  } catch (err) {
    if (cached) return { data: cached.data, source: "cache", fetchedAt: cached.at }; // stale but shown with its age
    throw new Error(`Forecast unavailable and nothing cached: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=25.76&longitude=-80.19";
  const cache = new Map();
  let t = 1_000_000;
  const now = () => t;
  const ok = async () => new Response(JSON.stringify({ daily: { time: ["2026-11-26"] } }), { status: 200 });
  const hang = (u, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
  const bad = async () => new Response(JSON.stringify({ error: true, reason: "Cannot initialize WeatherVariable" }), { status: 400 });

  let r = await getForecast(url, { fetchImpl: ok, cache, now });
  assert.equal(r.source, "network");

  t += 5 * 60 * 1000; // 5 min later → served from cache without a request
  r = await getForecast(url, { fetchImpl: () => assert.fail("should not fetch"), cache, now });
  assert.equal(r.source, "cache");

  t += 20 * 60 * 1000; // stale, network hangs → timeout → stale cache with its age
  r = await getForecast(url, { fetchImpl: hang, cache, now, timeoutMs: 50 });
  assert.equal(r.source, "cache");
  assert.equal(t - r.fetchedAt, 25 * 60 * 1000);

  await assert.rejects(getForecast("https://x/none", { fetchImpl: bad, cache, now }), /nothing cached: Cannot initialize/);
  console.log("03-fetch-with-timeout: all checks passed");
}
