---
name: automated-testing
description: "Flood's test stack and rules: Vitest unit and function tests, Playwright end-to-end with mocked network, no real external calls. Use when writing tests or code that needs them."
user-invocable: false
---
# Automated testing

Strategy: `docs/05-testing-and-accessibility.md` §1.

- **Vitest**: scoring (fixtures in `tests/fixtures/`), unit conversions, URL builders,
  allow-list, session sign/verify, agent front-matter parser, model alias map.
- **Function tests**: call each handler as `(Request) => Response` with mocked `fetch`
  for Claude and GitHub; cover auth required, bad input, rate/budget counters, stale
  `sha`, retry idempotency.
- **Playwright** (`--trace off` unless debugging): mock Open-Meteo with `page.route()`;
  city → scores → reasons; offline via `context.setOffline(true)`; console login → chat
  (mocked SSE) → diff → approve (mocked).
- Never call real Claude, GitHub or Netlify APIs in tests. One manual `npm run smoke`
  may hit Open-Meteo to catch API drift.
- Security code (`allowlist`, `auth`): table-driven hostile cases, ≥ 95 % branch coverage.
- A bug fix starts with a failing test.
- Report: command run, pass/fail counts, failing test names with the first error line.
