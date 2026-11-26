---
name: apple-hig-ux
description: "Apple Human Interface Guidelines–style interaction design for Flood: hierarchy, navigation, states, plain-language copy. Use when designing flows, screens or wording."
user-invocable: false
---
# Apple HIG interaction design

Principle: a stressed person, maybe on low battery, must see **their city's risk today**
within 3 seconds.

## Hierarchy (home)
1. City (with change control) and data time.
2. Today: Flood · Power · Beach — each a word + icon + one-line reason.
3. Next days as a compact list; tap for detail (reasons, hourly rain/wind).
4. Official links: NWS (incl. rip currents, D2), power outage map. Disclaimer.

## Patterns
- Tab bar or simple stack; no hamburger menus. Sheets for pickers.
- Tap targets ≥ 44 pt where possible (≥ 24 px minimum).
- States designed for every screen: loading, offline with age, error with retry, empty.
- Install hint on iPhone shown once, dismissible.
- Agent Console: list → chat → proposal diff → Approve (destructive-style confirmation:
  "This deploys to the live app").

## Copy
Short, plain, active, specific. Units with meaning ("1.5 in — enough to flood low
streets"). Never "safe"; say "Low". Times as "Today 3 PM".

Deliver: flow diagrams, wireframes with copy, acceptance criteria per screen.
