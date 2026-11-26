# Knowledge — `ui-designer-apple-liquid-glass`

Apple HIG materials (Liquid Glass), color and typography — Sable.

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [hig-color.md](docs/hig-color.md) | Apple HIG — Color | developer.apple.com |
| [hig-materials-liquid-glass.md](docs/hig-materials-liquid-glass.md) | Apple HIG — Materials and Liquid Glass | developer.apple.com |
| [hig-typography.md](docs/hig-typography.md) | Apple HIG — Typography | developer.apple.com |

## examples/ (worked examples)

- [`check-contrast.mjs`](examples/check-contrast.mjs) — Verifies Sable's tokens: WCAG contrast for every text/background pair in light, dark and
- [`risk-badge.html`](examples/risk-badge.html) — Risk badge and day cards under a glass top bar (open in a browser)
- [`tokens.css`](examples/tokens.css) — Design tokens: light, dark, increased contrast; glass with opaque fallbacks

**Run (from `examples/`):** `node check-contrast.mjs` (real Chromium: contrast in 4 modes + reduced transparency)

All code examples were run and passed on 2026-11-26. Re-run everything with
`cd knowledge && npm install && npm run verify`.
