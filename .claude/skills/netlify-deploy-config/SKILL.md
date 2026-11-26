---
name: netlify-deploy-config
description: "netlify.toml, headers, environment variables, deploys and rollbacks for Flood on the Free plan. Use when changing build, headers, env vars or deploy behaviour."
user-invocable: false
---
# Netlify deploy and config

- `netlify.toml`: `publish = "public"`, `[functions] node_bundler = "esbuild"`,
  `included_files = [".claude/agents/**"]`, security headers, `no-cache` for `/sw.js`.
  Sketch: `docs/03-architecture.md` §3.
- Every push to `main` deploys to production — including Agent Console approvals (D3).
- Rollback: publish the previous deploy from the Netlify deploy list, then fix forward.
- Plan: **Free** (D4). Watch credit usage; keep function calls low (weather goes
  browser → Open-Meteo directly).

## Environment variables
`ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`,
`CONSOLE_PASSWORD_HASH`, `SESSION_SECRET`, `DAILY_TOKEN_BUDGET`.
- Set them in the UI/CLI — `netlify.toml` variables are not available to functions. Scopes can only
  be restricted on Pro and above, so on Free (D4) they are visible to the build too: no build
  plugins, never print env. Flag secrets as **Contains secret values** where available.
  Values ≤ 5,000 characters.
- A `/api/health` function reports which names are set (never values) — secret-flagged
  vars have been reported missing from the functions runtime; check after each change.
- No front-end build reads env vars, so nothing can leak into `public/`.
