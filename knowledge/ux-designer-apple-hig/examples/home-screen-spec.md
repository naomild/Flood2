# Example 1 — Home screen spec (flow, hierarchy, copy, acceptance criteria)

Grounded in: HIG *Writing* (be clear, action-oriented, no "we"), HIG *Accessibility* (44×44 pt,
not colour alone), HIG *Typography* (Dynamic Type, keep hierarchy at large sizes), HIG *Alerts*
(no alert at launch). Persona: a Hialeah resident, 12 % battery, power flickering.

## Goal
See **my city's risk today within 3 seconds**, then the next days, then official sources.

## Layout (top → bottom; same order at every text size)
1. **Top bar (glass, control layer):** city name (Large Title) · "Updated 3:10 PM" (Footnote) ·
   **Change city** button.
2. **Today (3 cards, content layer, solid):**
   - Flood outlook — badge word + icon + one reason line
   - Power outage chance — badge + reason
   - Beach day — badge + reason + link **"Rip current risk: check the National Weather Service"** (D2)
3. **Next 6 days:** one row per day: "Fri" · flood badge · power badge · beach badge. Tap → detail.
4. **Official sources:** "National Weather Service Miami" · "FPL outage map" · disclaimer:
   "These outlooks are estimates from weather forecasts. Follow official warnings."
5. **Tab bar (glass):** Today · Days · Settings.

## Copy (sentence case; word list in docs/hig-writing.md)
| Element | Text |
|---|---|
| Flood badge levels | Low · Moderate · High · Very high |
| Reason (example) | "1.8 in of rain expected (90% chance)" |
| Updated | "Updated 3:10 PM" / offline: "Offline · Updated 3:10 PM" |
| Change city | "Change city" (verb first) |
| Loading | "Loading forecast…" |

## Large text (Dynamic Type / 200 % zoom)
Cards stack badge **above** the reason (HIG: "consider using a stacked layout"); day rows wrap to
two lines instead of truncating; tab bar labels stay visible.

## Acceptance criteria
- [ ] With a cold start on 3G, the three Today badges render before anything else below them.
- [ ] Every badge has a word and an icon; screen reader reads "Flood outlook, Very high. 17.2
      inches of rain expected…".
- [ ] All tap targets ≥ 44×44 px; at 200 % text nothing is cut off at 320 px width.
- [ ] No alert or modal appears at launch, online or offline.
- [ ] Beach card always shows the NWS rip-current link and never a rip-current level of our own.
