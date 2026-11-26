---
name: risk-scoring-code
description: "Rules for Flood's scoring code: pure functions, one THRESHOLDS object, reasons, fixture tests. Use when writing or changing flood, outage or beach scoring."
user-invocable: false
---
# Risk-scoring code

- Location: `src/scoring/`. Pure functions only — no `fetch`, no DOM, no `Date.now()`
  (pass "now" in).
- Entry point: `scoreDay(day, context) → { flood, outage, beach, reasons }` where each
  score is `{ value: 0–100, band: "low"|"moderate"|"high"|"very-high", reasons: string[] }`.
- All numbers live in one exported, frozen `THRESHOLDS` object. Logic never contains a
  magic number; the weather-risk-scientist tunes thresholds there.
- Bands: 0–24 low · 25–49 moderate · 50–74 high · 75–100 very high. Clamp to 0–100.
- Missing input → skip that factor and add a reason ("No tide data for this city"),
  never throw and never treat missing as zero risk silently.
- Reasons are plain language with units ("Up to 1.2 in of rain in one hour").
- Every rule change ships with a fixture-based test (input JSON → expected band + reason).
