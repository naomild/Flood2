# Open-Meteo Marine API

Source: Open-Meteo, *Marine Weather API* — <https://open-meteo.com/en/docs/marine-weather-api> (read 2026-11-26)

Endpoint: `https://marine-api.open-meteo.com/v1/marine` (same parameter style as the forecast API).

## Variables we use (units from the docs)
| Variable | Unit | Use |
|---|---|---|
| `wave_height` (hourly), `wave_height_max` (daily) | m | beach comfort only (not rip risk — D2) |
| `sea_surface_temperature` | °C | beach water temperature |
| `sea_level_height_msl` | m | relative "higher than usual tide" signal, coastal cities only |
| also available | `wave_direction`, `wave_period`, `wind_wave_*`, `swell_wave_*`, `ocean_current_velocity`, `invert_barometer_height` | not used yet |

## Models
MeteoFrance MFWAM / SMOC currents & tides (0.08°, ~8 km, 10 days), ECMWF WAM (9 km, 15 days),
NCEP GFS Wave (16 days), DWD EWAM / GWAM, ERA5-Ocean. API default 7 days.

## Caveats (quoted)
- "Accuracy at coastal areas is limited … it may be completely unreliable further inland."
- "not suitable for coastal navigation and does not replace your nautical almanac. Use with caution!"

## Conversions
m → ft: × 3.28084. °C → °F: × 9/5 + 32. Do it in one tested helper; keep raw values too.
For a tide signal compare each day's max `sea_level_height_msl` against the **range of the
whole response**, never as an absolute flood depth. The real fixture shows two highs a day of
≈ +0.3–0.4 m and lows of ≈ −0.5–0.7 m at Miami Beach.
