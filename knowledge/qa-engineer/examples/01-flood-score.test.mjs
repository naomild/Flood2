// Example 1 — Vitest unit tests for scoring, driven by a real recorded Open-Meteo fixture.
// Run (from a folder where vitest is installed):  npx vitest run 01-flood-score.test.mjs
// Rules: no network; a fixture per scenario; table-driven; a bug fix starts with a failing test.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseForecast } from "../../open-meteo-integrator/examples/02-parse-forecast.mjs";
import { scoreFlood, THRESHOLDS } from "../../weather-risk-scientist/examples/01-flood-score.mjs";

const fixture = (name) => JSON.parse(readFileSync(new URL(`../../open-meteo-integrator/examples/fixtures/${name}`, import.meta.url)));
const days = parseForecast(fixture("forecast-miami-2026-11-24.json"));
const day = (date) => days.find((d) => d.date === date);

describe("scoreFlood — Miami, recorded 2026-11-24..27", () => {
  it("rates the 17.2-inch downpour day very high and says why", () => {
    const r = scoreFlood(day("2026-11-25"), { coastal: true, tide: { tideRank: 1 } });
    expect(r.band).toBe("very-high");
    expect(r.reasons.join(" ")).toMatch(/17\.2 in of rain/);
    expect(r.reasons.join(" ")).toMatch(/overwhelm storm drains/);
  });

  it.each([
    { label: "dry day", o: { rainIn: 0, maxHourlyRainIn: 0, rainChance: 0 }, band: "low" },
    // boundary: (20 + 10) × 0.8 = 24 → still Low; Moderate starts at 25
    { label: "1.5 in, 0.6 in/h, 80% (boundary)", o: { rainIn: 1.5, maxHourlyRainIn: 0.6, rainChance: 80 }, band: "low" },
    { label: "1.5 in, 0.6 in/h, 90%", o: { rainIn: 1.5, maxHourlyRainIn: 0.6, rainChance: 90 }, band: "moderate" },
    { label: "3 in, 1.5 in/h, 90%", o: { rainIn: 3, maxHourlyRainIn: 1.5, rainChance: 90 }, band: "moderate" },
    { label: "5 in, 2.5 in/h, 100%", o: { rainIn: 5, maxHourlyRainIn: 2.5, rainChance: 100 }, band: "high" },
  ])("$label → $band", ({ o, band }) => {
    const r = scoreFlood({ ...day("2026-11-27"), thunder: false, ...o });
    expect(r.band).toBe(band);
  });

  it("treats missing data as a reason, not as zero risk", () => {
    const r = scoreFlood({ date: "2026-08-01", rainIn: null });
    expect(r.reasons).toContain("No rain forecast available for this day");
  });

  it("keeps all numbers in a frozen THRESHOLDS object", () => {
    expect(Object.isFrozen(THRESHOLDS)).toBe(true);
  });
});
