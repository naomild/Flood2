---
name: open-meteo-api
description: "How Flood calls the Open-Meteo forecast and marine APIs: endpoints, variables, units, limits and caveats. Use when building or changing any weather request or its fixtures."
user-invocable: false
---
# Open-Meteo APIs

Docs: https://open-meteo.com/en/docs · https://open-meteo.com/en/docs/marine-weather-api
Full field list and the city table: `docs/01-use-case-and-scoring.md` §2–3.

- Forecast: `https://api.open-meteo.com/v1/forecast`
- Marine: `https://marine-api.open-meteo.com/v1/marine`
- No key. Free tier: non-commercial, < 10,000 calls/day. Show an Open-Meteo attribution link.
- Always send `timezone=America/New_York`, `precipitation_unit=inch`,
  `wind_speed_unit=mph`, `temperature_unit=fahrenheit`, `forecast_days=7`, `past_days=3`.
- Marine values are metric (wave and sea-level heights in metres, SST in °C): convert in
  one tested helper.
- Several cities in one call: comma-separated `latitude`/`longitude` → response is an
  **array**. Handle both shapes.
- WMO thunderstorm codes: 95, 96, 97, 99.

## Caveats you must respect
- Marine data near coasts can be unreliable and is "not suitable for coastal navigation".
  Use `sea_level_height_msl` only as a relative "higher than usual" tide signal, coastal
  cities only.
- **No rip-current estimate** from any field (D2) — link to the NWS instead.

## Engineering rules
- One module builds URLs (`buildForecastUrl(city)`); one parses into a typed day model.
- Timeout ~4 s, then fall back to the service-worker cache and show the data's age.
- Record real responses as fixtures in `tests/fixtures/` (calm day, downpour, king tide,
  tropical storm, missing fields). Tests never hit the network.
