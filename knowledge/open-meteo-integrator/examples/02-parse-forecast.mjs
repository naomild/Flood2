// Example 2 — turn a real Open-Meteo response into Flood's per-day model.
// Run: node 02-parse-forecast.mjs   (uses the real responses in ./fixtures, captured 2026-11-26)
// Docs: https://open-meteo.com/en/docs (response format: parallel arrays keyed by `time`)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export const mToFt = (m) => Math.round(m * 3.28084 * 10) / 10;
export const cToF = (c) => Math.round((c * 9 / 5 + 32) * 10) / 10;

/** Group hourly values by local date ("2026-11-25T14:00" → "2026-11-25"). */
function hourlyByDate(hourly, key) {
  const out = new Map();
  hourly.time.forEach((t, i) => {
    const d = t.slice(0, 10);
    const v = hourly[key]?.[i];
    if (v === null || v === undefined) return;
    if (!out.has(d)) out.set(d, []);
    out.get(d).push(v);
  });
  return out;
}

/**
 * @returns {{date:string, rainIn:number|null, rainChance:number|null, maxHourlyRainIn:number|null,
 *   gustMph:number|null, windMph:number|null, thunder:boolean, maxCape:number|null,
 *   uvMax:number|null, highF:number|null}[]}
 */
export function parseForecast(json) {
  if (json?.error) throw new Error(`Open-Meteo error: ${json.reason}`);
  // Guard against unit surprises: the real API reports wind as "mp/h".
  assert.equal(json.daily_units.precipitation_sum, "inch");
  assert.match(json.daily_units.wind_gusts_10m_max, /^mp\/?h$/);

  const rainH = hourlyByDate(json.hourly, "precipitation");
  const codeH = hourlyByDate(json.hourly, "weather_code");
  const capeH = hourlyByDate(json.hourly, "cape");
  const d = json.daily;
  return d.time.map((date, i) => ({
    date,
    rainIn: d.precipitation_sum?.[i] ?? null,
    rainChance: d.precipitation_probability_max?.[i] ?? null,
    maxHourlyRainIn: rainH.has(date) ? Math.max(...rainH.get(date)) : null,
    gustMph: d.wind_gusts_10m_max?.[i] ?? null,
    windMph: d.wind_speed_10m_max?.[i] ?? null,
    thunder: (codeH.get(date) ?? [d.weather_code?.[i]]).some((c) => [95, 96, 97, 99].includes(c)),
    maxCape: capeH.has(date) ? Math.max(...capeH.get(date)) : null,
    uvMax: d.uv_index_max?.[i] ?? null,
    highF: d.temperature_2m_max?.[i] ?? null,
  }));
}

/** Marine: per-day max wave (ft), mean SST (°F), daily tide peak (m) and its 0–1 rank in the whole response. */
export function parseMarine(json) {
  const h = json.hourly;
  const seaAll = h.sea_level_height_msl.filter((v) => v !== null);
  const lo = Math.min(...seaAll), hi = Math.max(...seaAll);
  const waves = hourlyByDate(h, "wave_height");
  const sst = hourlyByDate(h, "sea_surface_temperature");
  const sea = hourlyByDate(h, "sea_level_height_msl");
  return [...waves.keys()].map((date) => {
    const peak = Math.max(...sea.get(date));
    const temps = sst.get(date);
    return {
      date,
      waveMaxFt: mToFt(Math.max(...waves.get(date))),
      waterF: cToF(temps.reduce((a, b) => a + b, 0) / temps.length),
      tidePeakM: peak,
      tideRank: hi === lo ? 0 : Math.round(((peak - lo) / (hi - lo)) * 100) / 100, // relative only!
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const here = new URL("./fixtures/", import.meta.url);
  const days = parseForecast(JSON.parse(readFileSync(new URL("forecast-miami-2026-11-24.json", here))));
  const marine = parseMarine(JSON.parse(readFileSync(new URL("marine-miami-beach-2026-11-25.json", here))));
  console.table(days);
  console.table(marine);

  const nov25 = days.find((x) => x.date === "2026-11-25");
  assert.equal(nov25.rainIn, 17.209);         // the record downpour day
  assert.equal(nov25.maxHourlyRainIn, 3.799);  // worst single hour
  assert.equal(nov25.rainChance, 100);
  assert.equal(nov25.thunder, false);          // codes that day were rain (61–65, 80), not 95–99
  assert.equal(days.length, 4);                // past_days=1 + forecast_days=3 in this fixture
  assert.equal(marine[0].waveMaxFt, 3.4);      // 1.04 m
  assert.ok(marine.every((m) => m.tideRank >= 0 && m.tideRank <= 1));
  assert.throws(() => parseForecast({ error: true, reason: "bad variable" }), /bad variable/);
  console.log("02-parse-forecast: all checks passed");
}
