// Example 1 — build Open-Meteo forecast and marine URLs the Flood way.
// Run: node 01-build-urls.mjs   (self-checks with node:assert, no network)
// Docs: https://open-meteo.com/en/docs · https://open-meteo.com/en/docs/marine-weather-api
import assert from "node:assert/strict";

export const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
export const MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine";

export const DAILY = [
  "precipitation_sum", "precipitation_probability_max", "precipitation_hours",
  "wind_gusts_10m_max", "wind_speed_10m_max", "weather_code", "uv_index_max", "temperature_2m_max",
];
export const HOURLY = ["precipitation", "precipitation_probability", "wind_gusts_10m", "weather_code", "cape"];

/** @param {{lat:number, lon:number}} city */
export function buildForecastUrl(city, { days = 7, pastDays = 3 } = {}) {
  const u = new URL(FORECAST_BASE);
  u.search = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    daily: DAILY.join(","),
    hourly: HOURLY.join(","),
    timezone: "America/New_York",        // daily boundaries in local time (fixed offset; DST ignored)
    forecast_days: String(days),          // default 7, max 16
    past_days: String(pastDays),          // antecedent rain for the flood score
    precipitation_unit: "inch",
    wind_speed_unit: "mph",
    temperature_unit: "fahrenheit",
  }).toString();
  return u.toString();
}

/** Marine data only for coastal cities; units stay metric (m, °C) — convert in the parser. */
export function buildMarineUrl(city, { days = 7 } = {}) {
  if (!city.coastal) return null;
  const u = new URL(MARINE_BASE);
  u.search = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    hourly: "wave_height,sea_level_height_msl,sea_surface_temperature",
    daily: "wave_height_max",
    timezone: "America/New_York",
    forecast_days: String(days),
  }).toString();
  return u.toString();
}

/** Several cities in one call: comma-separated coordinates; the response becomes an ARRAY. */
export function buildMultiCityForecastUrl(cities) {
  const u = new URL(buildForecastUrl(cities[0]));
  u.searchParams.set("latitude", cities.map((c) => c.lat).join(","));
  u.searchParams.set("longitude", cities.map((c) => c.lon).join(","));
  return u.toString();
}

// ---- self-check -----------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const miami = { name: "Miami", lat: 25.7617, lon: -80.1918, coastal: true };
  const hialeah = { name: "Hialeah", lat: 25.8576, lon: -80.2781, coastal: false };

  const f = new URL(buildForecastUrl(miami));
  assert.equal(f.origin + f.pathname, FORECAST_BASE);
  assert.equal(f.searchParams.get("timezone"), "America/New_York");
  assert.equal(f.searchParams.get("precipitation_unit"), "inch");
  assert.equal(f.searchParams.get("wind_speed_unit"), "mph");
  assert.equal(f.searchParams.get("past_days"), "3");
  assert.ok(f.searchParams.get("daily").includes("wind_gusts_10m_max"));

  assert.equal(buildMarineUrl(hialeah), null, "inland city gets no marine request");
  assert.ok(buildMarineUrl(miami).startsWith(MARINE_BASE));

  const multi = new URL(buildMultiCityForecastUrl([miami, hialeah]));
  assert.equal(multi.searchParams.get("latitude"), "25.7617,25.8576");
  console.log("01-build-urls: all checks passed");
  console.log(buildForecastUrl(miami));
}
