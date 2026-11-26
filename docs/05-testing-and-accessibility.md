# 05 · Testing and accessibility

## 1. Test layers

| Layer | Tool | What |
|---|---|---|
| Unit | **Vitest** | Scoring functions with recorded Open-Meteo fixtures (calm day, 3-inch downpour, king tide, tropical storm, missing fields); unit conversions; path allow-list; session-cookie sign/verify; agent front-matter parser; model alias mapping |
| Function / integration | Vitest + `fetch` mocks (or `msw`) | Each Netlify function as a plain `(Request) => Response`: auth required, wrong password, rate-limit counters, proposal → approve with mocked GitHub (`sha` mismatch → stale), Claude mocked (no real tokens in CI) |
| End-to-end | **Playwright** (`--trace off` by default) | Mock Open-Meteo with `page.route()`; pick a city; see scores and reasons; offline mode (`context.setOffline(true)`) shows cached forecast + "last updated"; Agent Console login → chat (mocked SSE) → proposal diff → approve (mocked) |
| PWA | Lighthouse CI / Chrome DevTools | Manifest valid, icons, service worker, works offline |
| Accessibility | **@axe-core/playwright** + manual | No violations on home and console pages; keyboard-only and screen-reader passes |
| Real device | Manual checklist | iPhone Safari Add to Home Screen; Android Chrome install |

Rules:

- Tests never call the real Claude, GitHub or Netlify APIs; a separate, manual
  `npm run smoke` can hit Open-Meteo once to detect API drift.
- Every bug fix to a score adds a fixture-based test first.
- Security code (`allowlist.ts`, `auth.ts`) needs ≥ 95 % branch coverage and
  table-driven tests with hostile paths (`../netlify.toml`, `public/../netlify.toml`,
  `public\\..\\x`, `%2e%2e/`, absolute paths, unicode look-alikes, very long names).
- CI: GitHub Actions running `npm test` and Playwright on PRs (the agents' GitHub token
  must *not* be able to edit `.github/workflows`).

## 2. Accessibility (target WCAG 2.2 AA)

Risk information is safety information, so it must be readable by everyone, quickly, on a
small screen, possibly in sunlight or on a dimmed low-battery screen.

| Requirement | How |
|---|---|
| Don't rely on colour | Each risk shows a **word** ("High") and an icon/pattern, not just red/amber/green (WCAG 1.4.1) |
| Contrast | Text ≥ 4.5:1, large text and UI parts ≥ 3:1 (1.4.3, 1.4.11); check both light and dark themes |
| Structure | One `<h1>`; `<main>`, `<nav>`; each day a `<section>` with heading; `lang="en"` (consider Spanish and Haitian Creole later — large South Florida audiences) |
| Live updates | Forecast refresh results announced with an `aria-live="polite"` region; offline banner uses `role="status"` |
| Forms | City `<select>` or combobox with a visible `<label>`; password field with label and `autocomplete="current-password"` |
| Keyboard | Everything reachable by Tab, visible focus ring, no traps; chat input submit with Enter and button |
| Touch targets | ≥ 24×24 CSS px (WCAG 2.2 SC 2.5.8); aim for 44×44 |
| Zoom / reflow | No `user-scalable=no`; layout works at 320 px width and 200 % text (1.4.4, 1.4.10) |
| Motion | Respect `prefers-reduced-motion`; no auto-playing animation for alerts |
| Units | Show inches **and** a plain phrase ("enough to flood streets"); mph for wind; °F |
| Charts | Any chart has a text/table equivalent |
| Streaming chat | Assistant output region `aria-live="polite"` but announce on completion, not every token |
| Time | Show times in America/New_York with "today/tomorrow" words |

Manual checks per release: VoiceOver on iPhone, TalkBack on Android, keyboard-only on
desktop, 200 % zoom.

## 3. Definition of done (per feature)

- Unit + e2e tests pass, axe reports no violations
- Lighthouse accessibility ≥ 95, PWA installable, works offline
- Reasons are shown for every score; disclaimer + NWS link present
- No secret, key or token in any file under `public/`
