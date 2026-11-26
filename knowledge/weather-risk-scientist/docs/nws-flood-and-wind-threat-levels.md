# NWS threat levels — flash flood and wind (Florida)

Sources (read 2026-11-26):
- NWS Melbourne, *Flood Threat Defined* — <https://www.weather.gov/mlb/flashflood_threat>
- NWS Melbourne, *Wind Threat Description* — <https://www.weather.gov/mlb/seasonal_wind_threat>
- NWS WPC, *Excessive Rainfall Outlook* — <https://www.wpc.ncep.noaa.gov/qpf/excessive_rainfall_outlook_ero.php>

## Flash flood threat (NWS MLB, Florida terrain)
Defined "within 12 miles of a location and within 6 hours of nearby heavy rain" from the
probability of flooding rain and the QPF/FFG ratio (forecast rain ÷ Flash Flood Guidance).
| Level | Example condition (quoted, abridged) |
|---|---|
| Extreme | ≥16 % chance with QPF/FFG > 2.0, or ≥26 % with 1.25–2.0, or ≥36 % with 0.75–1.25 |
| High | 6–15 % with > 2.0, or 16–25 % with 1.25–2.0, or 26–35 % with 0.75–1.25 |
| Moderate | 2–5 % with > 2.0, or 6–15 % with 1.25–2.0, or 16–25 % with 0.75–1.25 |
| Low | 2–5 % with 1.25–2.0, or 6–15 % with 0.75–1.25 |
| Very Low | 2–5 % with 0.75–1.25 |
| Non-Threatening | "environmental conditions do not support flash flooding" |

Impact wording (quoted, urban): **Minor** — "ponding of water occurs at certain underpasses or
poor drainage spots"; **Moderate** — "some streets and parking lots taking on moving water";
**Major** — "widespread inundation with streets and parking lots becoming rivers of moving water".

## Excessive Rainfall Outlook (WPC)
"forecasts the probability that rainfall will exceed flash flood guidance (FFG) within 40
kilometers (25 miles) of a point." Day 1–5 outlooks are published as GeoJSON/KML/shapefile —
a possible future official input (not used yet).

## Wind threat (NWS MLB)
| Level | Description (quoted) |
|---|---|
| High | "sustained speeds of 40 to 57 mph … consistent with a high wind warning" |
| Moderate | "sustained speeds of 26 to 39 mph, or frequent wind gusts of 35 to 57 mph … consistent with a wind advisory" |
| Low | "Sustained wind speeds of 21 to 25 mph, or frequent wind gusts of 30 to 35 mph" |
| Very Low | "Sustained wind speeds around 20 mph, or frequent gusts of 25 to 30 mph" |

## What this means for our scores
Open-Meteo gives QPF-like rain amounts but **not** Flash Flood Guidance, so we cannot compute
QPF/FFG. Our flood score is a heuristic proxy using rain rate (in/h), daily totals, prior rain
and tide; say "estimate" and defer to official NWS warnings.
