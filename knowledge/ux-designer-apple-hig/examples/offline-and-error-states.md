# Example 3 — Offline, loading, error and empty states

Grounded in HIG *Alerts* ("Avoid showing an alert when your app starts … show cached or placeholder
data and a nonintrusive label") and HIG *Writing* ("Write clear error messages", "Provide clear next
steps on any blank screens", avoid "we" and "oops").

| State | What the user sees | Notes |
|---|---|---|
| Loading (first ever) | Skeleton cards + "Loading forecast…" | No spinner-only screen |
| Loading (has cache) | Cached cards immediately + "Updating…" in the top bar | Never blank the old data |
| Offline with cache | Cards + top bar "Offline · Updated 3:10 PM" (`role="status"`) | Data older than 6 h adds: "This forecast may be out of date." |
| Offline, no cache | "No forecast saved yet. Connect to the internet to load the forecast for Miami." + **Try again** | Clear next step |
| Open-Meteo error | Cached data + "Unable to update the forecast. Showing 3:10 PM data." | Specific, no blame |
| City has no marine data (inland) | Beach card: "Beach day isn't available for Hialeah — it's inland." | Not an error |
| Agent Console, no proposals | "No changes waiting for approval. Ask an agent to propose one." + **Open chat** | Empty state with action |

Screen-reader behaviour: the top-bar status is a polite live region, so going offline/online is
announced once; card contents are not re-announced on every refresh.
