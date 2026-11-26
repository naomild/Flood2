---
name: flood-risk-science
description: "South Florida flood and power-outage drivers and how to communicate risk. Use when deciding what weather values mean danger, or writing risk wording."
user-invocable: false
---
# Flood and outage risk science

Sources and full tables: `docs/01-use-case-and-scoring.md` §1 and §4.

## Flood drivers (South Florida)
- **Rain rate** beats rain total: 1–2 in/h overwhelms storm drains.
- **Wet ground**: 3 days of prior rain raise canals and the water table.
- **King tides** (mostly Sep–Nov) push sea water up storm drains, even on dry days;
  flooding lasts ~3 h around the peak. Rain at high tide is the worst case.
- Thunderstorms (WMO 95–99) bring bursts of extreme rain.

## Outage drivers
- **Wind gusts** dominate: NWS wind-threat bands (gusts 25–30 very low, 30–35 low,
  35–57 moderate; sustained 40–57 high). ~55 mph gusts ≈ 3× the outage odds of ~45 mph.
- Thunderstorms/lightning, high CAPE, saturated ground (trees fall), tropical systems.

## Communicating risk
- Use NWS-style words: Low / Moderate / High / Very high. Never "safe".
- Always show **why** (the 1–3 inputs that drove the score) and the data time.
- Label scores as estimates; an active official NWS warning outranks our score.
- Link to the NWS and the power company's outage map. No rip-current estimate (D2).
- Uncertainty is shown, never hidden (show the rain probability).
