# Example 3 — An interface contract between two experts

The architect defines the seam; the open-meteo-integrator produces it, the weather-risk-scientist
consumes it, QA tests both sides against the same fixture. Changing this shape is an architecture
change (needs the architect + both owners).

```ts
/** Produced by parseForecast() — one per local calendar day (America/New_York). */
interface DayModel {
  date: string;                 // "2026-11-25" (local date from Open-Meteo `daily.time`)
  rainIn: number | null;        // daily precipitation_sum, inches
  rainChance: number | null;    // precipitation_probability_max, %
  maxHourlyRainIn: number | null; // max hourly precipitation that day, inches
  gustMph: number | null;       // wind_gusts_10m_max
  windMph: number | null;       // wind_speed_10m_max
  thunder: boolean;             // any hourly weather_code in {95, 96, 97, 99}
  maxCape: number | null;       // J/kg
  uvMax: number | null;
  highF: number | null;
}
/** Produced by parseMarine() — coastal cities only. */
interface MarineDay { date: string; waveMaxFt: number; waterF: number; tidePeakM: number; tideRank: number /* 0–1, relative */ }

/** Produced by scoring — consumed by the UI. */
interface Score { value: number /* 0–100 */; band: "low" | "moderate" | "high" | "very-high"; reasons: string[] }
```

Rules: `null` means "not available" and must produce a reason, never a silent zero. Units are fixed
by the request (`inch`, `mph`, `fahrenheit`); marine values are converted in one helper. Working
implementations: `knowledge/open-meteo-integrator/examples/02-parse-forecast.mjs`,
`knowledge/weather-risk-scientist/examples/01-flood-score.mjs`.
