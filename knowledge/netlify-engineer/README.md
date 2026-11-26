# Knowledge — `netlify-engineer`

Netlify Functions (limits, API, background, rate limits), env vars, Blobs, headers.

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [netlify-blobs.md](docs/netlify-blobs.md) | Netlify Blobs | docs.netlify.com |
| [netlify-environment-variables.md](docs/netlify-environment-variables.md) | Netlify environment variables (and functions) | docs.netlify.com |
| [netlify-functions-limits-and-api.md](docs/netlify-functions-limits-and-api.md) | Netlify Functions — syntax, limits, Context, background, rate limits | docs.netlify.com |
| [netlify-headers.md](docs/netlify-headers.md) | Netlify custom headers | docs.netlify.com |

## examples/ (worked examples)

- [`01-check-netlify-toml.py`](examples/01-check-netlify-toml.py) — Validates netlify.toml against Flood's rules. Run: python3 01-check-netlify-toml.py
- [`02-function-with-rate-limit.mjs`](examples/02-function-with-rate-limit.mjs) — Example 2 — a Netlify Function in the documented modern format, run locally as a plain
- [`03-idempotent-background-job.mjs`](examples/03-idempotent-background-job.mjs) — Example 3 — background job runner that survives Netlify's automatic retries (D4).
- [`netlify.toml`](examples/netlify.toml) — Flood's netlify.toml: publish dir, functions bundling, security headers

**Run (from `examples/`):** `python3 01-check-netlify-toml.py` · `node 02-function-with-rate-limit.mjs` · `node 03-idempotent-background-job.mjs`

All code examples were run and passed on 2026-11-26. Re-run everything with
`cd knowledge && npm install && npm run verify`.
