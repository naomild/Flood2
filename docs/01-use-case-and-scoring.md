# 01 · Use case, data and scoring

> Status: research notes, researched 2026-11-26. All thresholds below are **starting
> heuristics** to be tuned against real events. The app must say plainly that it is
> not an official forecast and link to the National Weather Service (NWS) and the
> power company's outage map.

## 1. The user and the problem

A resident of South Florida picks a city and wants three answers, fast, on a phone:

1. **Will it flood today, and over the next few days?** South Florida floods from
   (a) short, intense downpours that overwhelm storm drains, (b) multi-day rain that
   saturates the ground and raises canals, and (c) king tides (the highest seasonal
   tides, mostly September–November) that push sea water up through storm drains,
   sometimes on sunny days. Rain *during* a high tide is the worst case, because the
   drains have nowhere to empty.
2. **How likely is my power to go out?** Outages in South Florida come mostly from wind
   (gusts bringing down limbs and lines), thunderstorms and lightning, and trees falling
   over in saturated ground.
3. **Is it a good beach day?** (Original brief.) The Marine API makes this cheap to add,
   and it shares most inputs with the other two scores.

Because the user's power goes out, the app must **keep working offline and on low
battery**: the last forecast must be readable from cache with a clear "updated at" time.

### Sources for the use case

- City of Miami, King Tides: king-tide flooding "typically lasts about 3 hours, with 1.5
  hours of flood occurring before and then after the peak tide time."
  <https://www.miami.gov/My-Government/Climate-Change-in-the-City-of-Miami/King-Tides>
- Miami-Dade County, King Tides: highest seasonal tides, flooding low-lying areas "even
  when there is no rain"; salt water pushed into streets.
  <https://www.miamidade.gov/initiative/weather-ready/flooding/king-tides.page>
- Flood Risk America, *Miami Flooding: What November 2026 Taught Property Owners*:
  "Downpours of 1 to 2 inches an hour can overwhelm drainage systems"; king tides
  "push seawater up through storm drains and canals, so there's less room for
  rainwater to drain." <https://floodriskamerica.com/blog/miami-flooding/>
- NWS Melbourne, *Flood Threat Defined* (Florida-specific flash-flood threat levels,
  based on probability of rain exceeding Flash Flood Guidance within 6 hours and 12
  miles). <https://www.weather.gov/mlb/flashflood_threat>
- NWS Weather Prediction Center, *Excessive Rainfall Outlook*: probability that rainfall
  exceeds flash flood guidance within 25 miles of a point.
  <https://www.wpc.ncep.noaa.gov/qpf/excessive_rainfall_outlook_ero.php>
- NWS Melbourne, *Wind Threat Description*: Very Low (gusts 25–30 mph), Low (gusts
  30–35), Moderate (sustained 26–39 or gusts 35–57, wind-advisory level), High
  (sustained 40–57, high-wind-warning level). <https://www.weather.gov/mlb/seasonal_wind_threat>
- PowerOutage.us, *The March 13, 2026 Midwest Windstorm*: "peak wind gusts of ~55 mph
  are over three times more likely to produce outages than gusts near 45 mph."
  <https://poweroutage.us/research/march-13-midwest-windstorm>
- Shield, Quiring & McRoberts (2018), *Development of a Thunderstorm Outage Prediction
  Model* (Ohio State). <https://u.osu.edu/riskresearchhub/files/2020/05/2018-06-22-Development-of-a-Thunderstorm-Outage-Prediction-Model.pdf>
- Alpay et al. (2020), *Dynamic Modeling of Power Outages Caused by Thunderstorms*,
  Forecasting 2(2). <https://www.mdpi.com/2571-9394/2/2/8>
- Sharma et al. (2023), *Forecasting weather-related power outages using weighted
  logistic regression*, IET Smart Grid. <https://digital-library.theiet.org/doi/full/10.1049/stg2.12109>

## 2. Open-Meteo APIs (no key)

Read from the official docs (<https://open-meteo.com/en/docs>,
<https://open-meteo.com/en/docs/marine-weather-api>) on 2026-11-26. The API was found via
the directory at <https://mcp-api.netlify.app/>.

**Terms:** free API "only for non-commercial use and less than 10.000 daily API calls."
Show an attribution link to Open-Meteo in the footer (data licence is CC BY 4.0 per
Open-Meteo's licence page — confirm before launch). If the app ever becomes commercial,
it needs an Open-Meteo API plan (`apikey` parameter, customer endpoint).

### 2.1 Forecast API — `https://api.open-meteo.com/v1/forecast`

| Need | Hourly variables | Daily variables |
|---|---|---|
| Rain amount | `precipitation`, `rain`, `showers` | `precipitation_sum`, `rain_sum`, `showers_sum`, `precipitation_hours` |
| Rain chance | `precipitation_probability` | `precipitation_probability_max` |
| Wind | `wind_speed_10m`, `wind_gusts_10m` | `wind_speed_10m_max`, `wind_gusts_10m_max` |
| Storms | `weather_code` (WMO), `cape` | `weather_code` |
| Ground wetness | `soil_moisture_0_to_1cm` … `soil_moisture_27_to_81cm` | — |
| Beach | `temperature_2m`, `uv_index` | `temperature_2m_max`, `uv_index_max`, `uv_index_clear_sky_max` |

Useful parameters: `latitude`, `longitude` (comma-separated lists are allowed — the
response becomes a JSON **array**, one object per location), `hourly`, `daily`, `current`,
`timezone`, `forecast_days` (up to 16), `past_days`, `temperature_unit`,
`wind_speed_unit`, `precipitation_unit`, `models`.

WMO thunderstorm codes: **95** thunderstorm, **96** with slight hail, **97** heavy
thunderstorm, **99** with heavy hail. (Codes 61–65 rain, 80–82 rain showers — check the
full WMO table on the docs page when implementing.)

Recommended request for one city (7 days ahead, 3 days back for antecedent rain):

```
https://api.open-meteo.com/v1/forecast
  ?latitude=25.7617&longitude=-80.1918
  &daily=precipitation_sum,precipitation_probability_max,precipitation_hours,
         wind_gusts_10m_max,wind_speed_10m_max,weather_code,uv_index_max,temperature_2m_max
  &hourly=precipitation,precipitation_probability,wind_gusts_10m,weather_code,cape,
          soil_moisture_0_to_1cm
  &timezone=America%2FNew_York&forecast_days=7&past_days=3
  &precipitation_unit=inch&wind_speed_unit=mph&temperature_unit=fahrenheit
```

### 2.2 Marine API — `https://marine-api.open-meteo.com/v1/marine`

Hourly: `wave_height`, `wave_direction`, `wave_period`, `wind_wave_*`, `swell_wave_*`,
`secondary_/tertiary_swell_*`, `sea_surface_temperature` (°C), `ocean_current_velocity`,
`ocean_current_direction`, **`sea_level_height_msl`** (metres, includes tides) and
`invert_barometer_height`. Daily: `wave_height_max`, `wave_period_max`, dominant
directions, etc. Wave/sea heights are in metres: convert to feet in the client.

Models: MeteoFrance MFWAM / SMOC currents & tides (0.08°, 10 days), ECMWF WAM (9 km,
15 days), NCEP GFS Wave (16 days), DWD EWAM/GWAM. Default 7 days.

**Caveats (from the docs):** "Accuracy at coastal areas is limited … may be completely
unreliable further inland" and "not suitable for coastal navigation and does not replace
your nautical almanac." So:

- Use `sea_level_height_msl` only as a **relative** "higher than usual tide" signal
  (compare against the 7-day range at that point), never as a flood depth.
- For inland cities (Hialeah, Homestead, Doral) skip the tide factor or use the
  nearest coastal point.
- Better official tide source to evaluate later: NOAA CO-OPS tide predictions (e.g.
  Virginia Key station) — not verified in this research pass.

### 2.3 Official alerts (recommended complement, not yet verified)

The NWS API (`api.weather.gov`, free, no key, requires a `User-Agent` header) serves
active alerts such as Flood Watch and Flash Flood Warning by point. When an official
warning is active, it should override the app's own score in the UI. The docs for this
were **not** read in this pass; an agent should read them before building it.

## 3. City list (starting set)

| City | Lat | Lon | Coastal tide factor |
|---|---|---|---|
| Miami | 25.7617 | -80.1918 | yes |
| Miami Beach | 25.7907 | -80.1300 | yes |
| Hialeah | 25.8576 | -80.2781 | no |
| Coral Gables | 25.7215 | -80.2684 | partial |
| Homestead | 25.4687 | -80.4776 | no |
| Key West | 24.5551 | -81.7800 | yes |
| Fort Lauderdale | 26.1224 | -80.1373 | yes |
| Hollywood | 26.0112 | -80.1495 | yes |
| Pompano Beach | 26.2379 | -80.1248 | yes |
| Boca Raton | 26.3683 | -80.1289 | yes |
| Delray Beach | 26.4615 | -80.0728 | yes |
| West Palm Beach | 26.7153 | -80.0534 | yes |
| Palm Beach Gardens | 26.8234 | -80.1387 | partial |

Store this as `public/data/cities.json` so agents and the UI share one list. Also offer
"Use my location" (Geolocation API) as an option.

## 4. Scores

All three scores are 0–100 with four labelled bands, computed **per day** in a pure
function (`scoreDay(dayData) → {flood, outage, beach, reasons[]}`) so they are trivially
unit-testable. Every score must return the human-readable **reasons** that drove it
("1.8 in of rain expected, up to 1.2 in in one hour", "gusts to 48 mph").

Bands (shared): **0–24 Low · 25–49 Moderate · 50–74 High · 75–100 Very high**.

### 4.1 Flood score

| Factor | Input | Points (cap) |
|---|---|---|
| Rain total | `precipitation_sum` (in) | <0.5 → 0; 0.5–1 → 10; 1–2 → 20; 2–4 → 30; >4 → 40 |
| Rain intensity | max hourly `precipitation` that day (in/h) | <0.5 → 0; 0.5–1 → 10; 1–2 → 20 (drains overwhelmed); >2 → 30 |
| Confidence | `precipitation_probability_max` | multiply the two rain factors by `max(0.4, p/100)` |
| Wet ground | sum of previous 3 days' `precipitation_sum` | >2 in → +10; >4 in → +15 |
| Tide | daily max `sea_level_height_msl` in top 20 % of its 7-day range, coastal cities only | +10; +15 in Sep–Nov (king-tide season) |
| Rain at high tide | heavy rain hour (>0.5 in) within ±2 h of the daily tide peak | +10 |
| Thunderstorm | `weather_code` 95–99 | +5 |

Map to the NWS vocabulary in the UI ("Low / Moderate / High threat of flooding") but
label it "Flood outlook (estimate)". If an official NWS flood warning is active, show it
above the score.

### 4.2 Power-outage likelihood

| Factor | Input | Points (cap) |
|---|---|---|
| Wind gusts | `wind_gusts_10m_max` (mph) | <25 → 0; 25–35 → 10; 35–45 → 25; 45–57 → 45; ≥57 → 65 (thresholds follow NWS MLB wind-threat bands; ~55 mph gusts ≈3× outage odds of ~45 mph per PowerOutage.us) |
| Thunderstorms / lightning | `weather_code` 95–99 on any hour | +15 (97 or 99 → +20) |
| Instability | max hourly `cape` (J/kg) | >1000 → +5; >2500 → +10 |
| Saturated ground (trees fall) | flood score ≥ 50 or previous-3-day rain > 3 in | +10 |
| Tropical system | sustained `wind_speed_10m_max` ≥ 39 mph | floor score at 75 |

Display as "Chance your power goes out: Low / Moderate / High / Very high" plus reasons.
**Personal calibration:** let the user tap "My power went out" (stored in IndexedDB
on the device only, with the timestamp and that day's inputs). After a few events the
app can show "Your past outages happened with gusts ≥ X mph" — this is the most honest
way to tune a per-household model without collecting personal data.

### 4.3 Beach-day score (original brief)

Start at 100 and subtract:

| Factor | Input | Penalty |
|---|---|---|
| Rain | `precipitation_probability_max` | −0.6 × p |
| Storms | `weather_code` 95–99 during 9am–6pm | −40 |
| Wind | `wind_speed_10m_max` (mph) | >15 → −10; >20 → −25 |
| Waves | daily max `wave_height` (ft) | >3 → −10; >5 → −30 (comfort and surf only, **not** a rip-current estimate) |
| Water temp | `sea_surface_temperature` (°F) | <72 → −15 |
| Air temp | `temperature_2m_max` (°F) | <70 → −20; >95 → −10 |
| UV | `uv_index_max` | ≥ 8 → no penalty, but show a sunscreen tip (UV 8–10 is "very high", 11+ "extreme" per the WHO/EPA UV scale) |

Bands are inverted for beach ("Great / Good / Meh / Stay home").

**Rip currents (decision D2, see `decisions.md`):** the app does **not** estimate rip-current
risk from wave height or any other Open-Meteo field. The beach card always shows a
"Rip current risk: check the National Weather Service" link to the official NWS surf-zone /
rip-current forecast for the area (NWS Miami office for Miami-Dade, Broward and Palm Beach;
NWS Key West for the Keys). The exact URLs must be verified before release.

## 5. Design rules for the scoring code

- Pure functions in `src/scoring/*.js`, no network or DOM access; fixtures in
  `tests/fixtures/*.json` captured from real API responses (including a calm day, a
  king-tide day, a 3-inch downpour and a tropical-storm day).
- All thresholds in one exported `THRESHOLDS` object so a "meteorologist" agent can tune
  them without touching logic.
- Never hide uncertainty: show the probability, the reasons and the data time.
