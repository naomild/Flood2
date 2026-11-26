# Knowledge — `qa-engineer`

Playwright mocking, offline, service workers, accessibility, web server; Vitest.

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [playwright-mocking-offline-a11y.md](docs/playwright-mocking-offline-a11y.md) | Playwright — mocking APIs, offline, service workers, accessibility, web server | playwright.dev |

## examples/ (worked examples)

- [`01-flood-score.test.mjs`](examples/01-flood-score.test.mjs) — Example 1 — Vitest unit tests for scoring, driven by a real recorded Open-Meteo fixture.
- [`02-ui-mocked-and-a11y.spec.mjs`](examples/02-ui-mocked-and-a11y.spec.mjs) — Example 2 — UI test with a mocked weather API + an axe accessibility scan.
- [`03-offline.spec.mjs`](examples/03-offline.spec.mjs) — Example 3 — offline behaviour with the REAL service worker (no page.route: the SW must see the
- [`playwright.config.mjs`](examples/playwright.config.mjs) — Playwright config (pattern from https://playwright.dev/docs/test-webserver).
- [`serve-demo.mjs`](examples/serve-demo.mjs) — Tiny static server for the PWA demo app (used by playwright.config.mjs webServer).

**Run (from `examples/`):** `npx vitest run 01-flood-score.test.mjs` · `npx playwright test --config playwright.config.mjs --trace off`

All code examples were run and passed on 2026-11-26. Re-run everything with
`cd knowledge && npm install && npm run verify`.
