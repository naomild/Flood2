// Example 2 — Power-outage likelihood with table-driven cases.
// Run: node 02-outage-score.mjs
// Sources: NWS MLB wind-threat bands (https://www.weather.gov/mlb/seasonal_wind_threat);
// PowerOutage.us: ~55 mph gusts are "over three times more likely to produce outages than gusts
// near 45 mph" (https://poweroutage.us/research/march-13-midwest-windstorm). HEURISTIC, not a utility model.
import assert from "node:assert/strict";

export const OUTAGE = Object.freeze({
  gustMph: [[57, 65], [45, 45], [35, 25], [25, 10]],
  thunder: { any: 15, severe: 20, severeCodes: [97, 99] },
  capeJkg: [[2500, 10], [1000, 5]],
  saturatedPoints: 10,          // trees fall in wet ground
  tropicalSustainedMph: 39,     // tropical-storm force → floor at 75
  tropicalFloor: 75,
});
const pick = (t, v) => (t.find(([m]) => v >= m) ?? [0, 0])[1];
const band = (v) => (v >= 75 ? "very-high" : v >= 50 ? "high" : v >= 25 ? "moderate" : "low");

export function scoreOutage(day, { floodValue = 0, priorRainIn = 0 } = {}) {
  const O = OUTAGE, reasons = [];
  let v = 0;
  if (day.gustMph != null) {
    const g = pick(O.gustMph, day.gustMph);
    v += g;
    if (g) reasons.push(`Wind gusts up to ${Math.round(day.gustMph)} mph`);
  } else reasons.push("No wind forecast available");
  if (day.thunderCodes?.length) {
    const severe = day.thunderCodes.some((c) => O.thunder.severeCodes.includes(c));
    v += severe ? O.thunder.severe : O.thunder.any;
    reasons.push(severe ? "Heavy thunderstorms and lightning possible" : "Thunderstorms and lightning possible");
  }
  const c = day.maxCape == null ? 0 : pick(O.capeJkg, day.maxCape);
  if (c) { v += c; reasons.push("Unstable air that can fuel strong storms"); }
  if (floodValue >= 50 || priorRainIn > 3) { v += O.saturatedPoints; reasons.push("Soaked ground makes trees easier to topple"); }
  if ((day.windMph ?? 0) >= O.tropicalSustainedMph) { v = Math.max(v, O.tropicalFloor); reasons.unshift("Tropical-storm-force winds"); }
  v = Math.min(100, v);
  if (!reasons.length) reasons.push("Light winds and no storms expected");
  return { value: v, band: band(v), reasons };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cases = [
    // name,                     day input,                                                ctx,                expected band
    ["calm day",                 { gustMph: 18, windMph: 8, maxCape: 200 },                {},                 "low"],
    ["breezy, Nov 26 (real)",    { gustMph: 32.7, windMph: 12.6, maxCape: 180 },           { priorRainIn: 17.2 }, "low"],
    ["wind-advisory gusts",      { gustMph: 48, windMph: 25, maxCape: 500 },               {},                 "moderate"],
    ["gusty thunderstorm",       { gustMph: 50, windMph: 22, maxCape: 2800, thunderCodes: [95] }, {},         "high"],
    ["severe storm, wet ground", { gustMph: 60, windMph: 30, maxCape: 3000, thunderCodes: [97] }, { floodValue: 60 }, "very-high"],
    ["tropical storm",           { gustMph: 44, windMph: 41, maxCape: 900 },               {},                 "very-high"],
    ["missing wind data",        { gustMph: null, windMph: null, maxCape: null },          {},                 "low"],
  ];
  for (const [name, day, ctx, want] of cases) {
    const r = scoreOutage(day, ctx);
    console.log(name.padEnd(26), String(r.value).padStart(3), r.band.padEnd(9), "—", r.reasons.join("; "));
    assert.equal(r.band, want, name);
  }
  assert.ok(scoreOutage({ gustMph: 44, windMph: 41 }).reasons[0] === "Tropical-storm-force winds");
  assert.deepEqual(scoreOutage({ gustMph: 18, windMph: 8 }).reasons, ["Light winds and no storms expected"]);
  assert.ok(scoreOutage({ gustMph: null }).reasons.includes("No wind forecast available"));
  console.log("02-outage-score: all checks passed");
}
