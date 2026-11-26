---
name: accessibility-wcag
description: "WCAG 2.2 AA requirements as applied to Flood. Use when designing, building or reviewing any user-facing screen."
user-invocable: false
---
# Accessibility (WCAG 2.2 AA)

Full checklist: `docs/05-testing-and-accessibility.md` §2.

- **Not colour alone** (1.4.1): every risk level has a word and an icon.
- **Contrast**: text ≥ 4.5:1, large text/UI ≥ 3:1 — test on glass over the busiest
  background, in light and dark.
- `prefers-reduced-transparency`, `prefers-reduced-motion`, `prefers-contrast` honoured.
- Semantics: landmarks, one `<h1>`, headings per day, `lang` attribute, labelled controls.
- Live updates: `aria-live="polite"` for refreshed forecasts; `role="status"` for the
  offline banner; chat announces on completion, not per token.
- Keyboard: all reachable, visible focus, no traps. Touch targets ≥ 24×24 px (2.5.8).
- Zoom/reflow: works at 320 px and 200 % text; never disable zoom.
- Charts have a text or table equivalent.
