# Example 3 — Risk wording that is honest and useful

Sources: NWS MLB *Flood Threat Defined* impact wording (<https://www.weather.gov/mlb/flashflood_threat>),
Apple HIG *Writing* (<https://developer.apple.com/design/human-interface-guidelines/writing>).
Wording owner: weather-risk-scientist with Wren (UX). Rules: say what, how sure, why, and what to do;
never "safe"; official warnings outrank our estimate.

## Good: very high flood (real case — Miami, 2026-11-25, from `01-flood-score.mjs`)
> **Flood outlook: Very high** (estimate)
> 17.2 in of rain expected (100% chance) · Up to 3.8 in in one hour — enough to overwhelm storm
> drains · High tide near its peak during king-tide season
> Avoid driving through flooded streets. **Check the National Weather Service for warnings.**

## Good: official warning active
> **Flash Flood Warning** — National Weather Service, until 9:45 PM
> *Our estimate: Very high.* Follow the warning instructions.

(The NWS product is shown first and visually stronger; our score becomes secondary.)

## Good: low risk, but not "safe"
> **Flood outlook: Low** (estimate) · Little or no rain expected · Ground still wet from earlier rain

## Good: missing data
> **Power outage chance: Low** · No wind forecast available right now — updated 3:10 PM
(Don't hide gaps; a missing input is a reason, not silence.)

## Bad → better
| Bad | Why | Better |
|---|---|---|
| "You're safe today!" | Overclaims; we can't know | "Flood outlook: Low" |
| "Flood score 85/100" | Number without meaning | "Very high · 17.2 in of rain expected" |
| "Risk: HIGH" in red only | Colour/caps alone | Word + icon + reason |
| "Rip current risk: moderate (waves 4 ft)" | Violates D2 — we don't estimate rips | "Rip current risk: check the National Weather Service" (link) |
| "Oops, we couldn't load data" | "we", "oops" (HIG) | "Unable to load the forecast. Showing 3:10 PM data." |
