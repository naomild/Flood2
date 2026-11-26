# Rip currents (link-out only, D2) and king tides

Sources (read 2026-11-26):
- NWS Miami, *Surf Zone Forecast* (product SRF) —
  <https://forecast.weather.gov/product.php?site=MFL&issuedby=MFL&product=SRF&format=CI&version=1&glossary=0>
- NWS, *Beach Forecast — Miami/South Florida* — <https://www.weather.gov/beach/mfl>
- NWS, *Rip Current Safety* — <https://www.weather.gov/safety/ripcurrent>
- City of Miami, *King Tides* — <https://www.miami.gov/My-Government/Climate-Change-in-the-City-of-Miami/King-Tides>
- Miami-Dade County, *King Tides* — <https://www.miamidade.gov/initiative/weather-ready/flooding/king-tides.page>

## Rip currents — what the NWS publishes (we only link to it)
The NWS Miami Surf Zone Forecast covers zones **Coastal Palm Beach (FLZ168)**, **Coastal Broward
(FLZ172)**, **Coastal Miami-Dade (FLZ173)** and Coastal Collier, each with "Rip Current
Risk", surf height, thunderstorm/waterspout risk, UV, water temperature and **tide times**.
Categories (quoted):
- "Low Risk - The risk for rip currents is low, however, life-threatening rip currents often
  occur in the vicinity of groins, jetties, reefs, and piers."
- "Moderate Risk - Life-threatening rip currents are possible in the surf zone."
- "High Risk - Life-threatening rip currents are likely in the surf zone."
The beach page adds for High: "The surf zone is dangerous for all levels of swimmers. Stay out
of the water."

**D2:** Flood never estimates this. Beach cards link to `https://www.weather.gov/beach/mfl`
(map) and the SRF product. Keys cities: NWS Key West — URL **not verified yet**.

## King tides
- City of Miami: king-tide flooding "typically lasts about 3 hours, with 1.5 hours of flood
  occurring before and then after the peak tide time."
- Miami-Dade: the highest seasonal tides, flooding low-lying areas "even when there is no rain".
- Season: mostly September–November (multiple local sources). Use Open-Meteo
  `sea_level_height_msl` only as a relative signal (see open-meteo-integrator notes).
