// Example 1 — Flood score: pure function, one THRESHOLDS object, reasons, real-data check.
// Run: node 01-flood-score.mjs
// Inputs come from the open-meteo-integrator's day model (its 02-parse-forecast.mjs).
// Threshold sources: docs/01-use-case-and-scoring.md §4.1, NWS MLB flood threat, Flood Risk America
// ("Downpours of 1 to 2 inches an hour can overwhelm drainage systems"). These are HEURISTICS.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseForecast, parseMarine } from "../../open-meteo-integrator/examples/02-parse-forecast.mjs";

export const THRESHOLDS = Object.freeze({
  bands: [[75, "very-high"], [50, "high"], [25, "moderate"], [0, "low"]],
  rainTotalIn: [[4, 40], [2, 30], [1, 20], [0.5, 10]],        // [min inches, points]
  rainRateInPerHr: [[2, 30], [1, 20], [0.5, 10]],
  minConfidence: 0.4,                                          // floor for the rain-chance multiplier
  priorRainIn: [[4, 15], [2, 10]],                             // previous 3 days
  tide: { rankAtLeast: 0.8, points: 10, kingTidePoints: 15, kingTideMonths: [9, 10, 11] },
  thunderPoints: 5,
});

const pick = (table, v) => (table.find(([min]) => v >= min) ?? [0, 0])[1];
export const band = (v) => THRESHOLDS.bands.find(([min]) => v >= min)[1];

/**
 * @param {object} day   one entry of parseForecast()
 * @param {{priorRainIn?: number, tide?: {tideRank:number}|null, coastal?: boolean}} ctx
 */
export function scoreFlood(day, { priorRainIn = 0, tide = null, coastal = false } = {}) {
  const T = THRESHOLDS, reasons = [];
  let rain = 0;
  if (day.rainIn == null) reasons.push("No rain forecast available for this day");
  else {
    const total = pick(T.rainTotalIn, day.rainIn);
    const rate = day.maxHourlyRainIn == null ? 0 : pick(T.rainRateInPerHr, day.maxHourlyRainIn);
    const conf = Math.max(T.minConfidence, (day.rainChance ?? 100) / 100);
    rain = (total + rate) * conf;
    if (total) reasons.push(`${day.rainIn.toFixed(1)} in of rain expected (${day.rainChance ?? "?"}% chance)`);
    if (rate) reasons.push(`Up to ${day.maxHourlyRainIn.toFixed(1)} in in one hour — enough to overwhelm storm drains`);
    if (!total && !rate) reasons.push("Little or no rain expected");
  }
  const wet = pick(T.priorRainIn, priorRainIn);
  if (wet) reasons.push(`Ground already wet: ${priorRainIn.toFixed(1)} in in the last 3 days`);
  let tidePts = 0;
  if (coastal && tide && tide.tideRank >= T.tide.rankAtLeast) {
    const month = Number(day.date.slice(5, 7));
    const king = T.tide.kingTideMonths.includes(month);
    tidePts = king ? T.tide.kingTidePoints : T.tide.points;
    reasons.push(king ? "High tide near its peak during king-tide season" : "Higher than usual tide");
  } else if (coastal && !tide) reasons.push("No tide data for this city");
  const thunder = day.thunder ? T.thunderPoints : 0;
  if (thunder) reasons.push("Thunderstorms possible");
  const value = Math.round(Math.min(100, Math.max(0, rain + wet + tidePts + thunder)));
  return { value, band: band(value), reasons };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fx = new URL("../../open-meteo-integrator/examples/fixtures/", import.meta.url);
  const days = parseForecast(JSON.parse(readFileSync(new URL("forecast-miami-2026-11-24.json", fx))));
  const tides = parseMarine(JSON.parse(readFileSync(new URL("marine-miami-beach-2026-11-25.json", fx))));
  const results = days.map((d, i) => {
    const priorRainIn = days.slice(Math.max(0, i - 3), i).reduce((s, x) => s + (x.rainIn ?? 0), 0);
    const tide = tides.find((t) => t.date === d.date) ?? null;
    return { date: d.date, ...scoreFlood(d, { priorRainIn, tide, coastal: true }) };
  });
  for (const r of results) console.log(r.date, r.value, r.band, "—", r.reasons.join("; "));

  const by = Object.fromEntries(results.map((r) => [r.date, r]));
  assert.equal(by["2026-11-25"].band, "very-high");   // 17.2 in, 3.8 in/h, king-tide month
  assert.equal(by["2026-11-25"].value, 85);
  assert.equal(by["2026-11-27"].band, "low");          // dry, but ground still wet from the 25th
  assert.ok(by["2026-11-27"].reasons.some((r) => r.startsWith("Ground already wet")));
  assert.ok(by["2026-11-24"].reasons.includes("No tide data for this city"));
  assert.ok(by["2026-11-24"].reasons.includes("Little or no rain expected")); // marine fixture starts on the 25th
  // Missing data never throws and never silently means "zero risk"
  assert.deepEqual(scoreFlood({ date: "2026-06-01", rainIn: null }).reasons, ["No rain forecast available for this day"]);
  assert.ok(Object.isFrozen(THRESHOLDS));
  console.log("01-flood-score: all checks passed");
}
