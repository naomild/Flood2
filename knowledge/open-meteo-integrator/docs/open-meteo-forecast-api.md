# Open-Meteo Forecast API

Source: Open-Meteo, *Weather Forecast API docs* — <https://open-meteo.com/en/docs> (read 2026-11-26)

Endpoint: `https://api.open-meteo.com/v1/forecast`. No key. Free tier: "Only for non-commercial
use and less than 10.000 daily API calls."

## Parameters we use (quoted descriptions)
| Parameter | Doc text | Flood value |
|---|---|---|
| `latitude`, `longitude` | Comma-separated lists allowed; then "the JSON output changes to a list of structures" | one city or many |
| `hourly`, `daily`, `current` | variable lists | see below |
| `timezone` | UTC offset "resolved at request time … used for ISO 8601 timestamps and daily boundaries". **"Daylight saving time (DST) changes within the requested range are ignored."** `auto` resolves from coordinates. Default GMT | `America/New_York` |
| `forecast_days` | "Per default, only 7 days are returned. Up to 16 days" | 7 |
| `past_days` | "yesterday or the day before yesterday data are also returned" | 3 |
| `temperature_unit` | "If fahrenheit is set, all temperature values are converted" | `fahrenheit` |
| `wind_speed_unit` | `kmh`, `ms`, `mph`, `kn` | `mph` |
| `precipitation_unit` | `mm`, `inch` | `inch` |
| `timeformat` | `iso8601` (fixed offset) or `unixtime` — use unixtime "for DST-aware local times" | `iso8601` |
| `models` | "Per default, the best suitable weather models will be combined." | default |
| `cell_selection` | `land` (default, elevation-matched), `sea`, `nearest` | default |

## Variables (quoted definitions)
- `precipitation` — "Total precipitation (rain, showers, snow) sum of the preceding hour".
- `precipitation_probability` — "Probability of precipitation with more than 0.1 mm of the
  preceding hour. Probability is based on ensemble weather models with 0.25° (~27 km)
  resolution. 30 different simulations".
- `weather_code` — WMO code (95 thunderstorm, 96 slight hail, 97 heavy thunderstorm, 99 heavy hail).
- `wind_gusts_10m` — "Gusts at 10 meters above ground as a maximum of the preceding hour".
- `cape` — "Convective available potential energy", J/kg.
- `precipitation_hours` — "The number of hours with rain".
- Daily: `precipitation_sum`, `precipitation_probability_max`, `wind_gusts_10m_max`,
  `wind_speed_10m_max`, `uv_index_max`, `temperature_2m_max`.

## Response
`latitude`/`longitude` are "the center of the weather grid-cell … might be a few kilometres away
from the requested coordinate"; `elevation`; `generationtime_ms`; `utc_offset_seconds`
("fixed throughout the response, including across daylight saving time transitions");
`timezone`, `timezone_abbreviation`; `hourly` + `hourly_units`; `daily` + `daily_units`;
`current`. Arrays are parallel to `time`.
Real responses report wind units as `"mp/h"` (not `"mph"`) — see the fixture.

## Errors
HTTP **400** with `{"error": true, "reason": "Cannot initialize WeatherVariable from invalid
String value tempeture_2m for key hourly"}`.

## Freshness → caching
Model update frequencies on the page: GFS & RRFS every hour; ICON every 3 h; IFS every 6 h; etc.
So caching a forecast for **15 minutes** loses nothing meaningful; re-fetch on app launch and
when the cached copy is older than 15 min. In the service worker: network-first with a 4 s
timeout, cached fallback with its fetch time shown.

## DST note for Flood
With `timezone=America/New_York`, a 7-day request spanning a DST change (March/November) uses
one fixed offset for the whole response. Our day boundaries can be an hour off on those days —
acceptable for daily outlooks; use `timeformat=unixtime` if hour-level labels must be exact.
