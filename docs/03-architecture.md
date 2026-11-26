# 03 · Architecture: static Netlify site + Netlify Functions

Researched 2026-11-26 from Netlify's docs (Functions overview, API reference,
configuration, background functions, Blobs, environment variables, rate limiting).

## 1. Netlify facts that shape the design

| Fact | Value | Source |
|---|---|---|
| Synchronous function limit | **60 s**, not configurable | <https://docs.netlify.com/build/functions/configuration/> |
| Streaming function | **60 s** execution, **20 MB** response | <https://docs.netlify.com/build/functions/api/> |
| Background function | **15 min**; client immediately gets **202** | <https://docs.netlify.com/build/functions/background-functions/> |
| Scheduled function | 30 s limit | <https://docs.netlify.com/build/functions/scheduled-functions/> |
| Function syntax | `export default async (req: Request, context: Context) => Response` + `export const config = { path: "/api/x" }` | Functions overview |
| Background syntax | `export const config = { background: true, path: "/process" }` (or legacy `-background` filename suffix) | Background functions |
| Rate limits | `config.rateLimit = { windowLimit, windowSize (1–180 s), aggregateBy: ["ip","domain"], action: "rate_limit" \| "rewrite" }`; **cannot** be set in `netlify.toml` for functions | <https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/> |
| Blobs | `getStore(name)`, `set/setJSON/get(key,{type:"json"})/delete/list`; eventual consistency (≤60 s) by default, `consistency: "strong"` available; conditional writes `onlyIfNew` / `onlyIfMatch` | <https://docs.netlify.com/build/data-and-storage/netlify-blobs/> |
| Secrets | Mark env vars **Contains secret values** (Secrets Controller): write-only in UI, secret scanning of build output | <https://docs.netlify.com/build/environment-variables/secrets-controller/> |

Gotcha seen in the community forum: a secret-flagged variable not reaching the functions
runtime in one deploy (<https://answers.netlify.com/t/env-vars-flagged-contains-secret-values-not-injected-into-functions-runtime-process-env-non-secret-vars-work-fine-same-deploy/167922>).
Make sure each variable's **scope includes Functions**, read it with `Netlify.env.get("NAME")`
(or `process.env.NAME`), and have a `/api/health` function that reports *which* required
variables are present (names only, never values).

## 2. Shape of the system

```
Phone (PWA)                                  Netlify
┌──────────────────────────┐   HTTPS   ┌─────────────────────────────────────────┐
│ Static app (HTML/CSS/JS) │──────────▶│ CDN: /index.html, /app.js, /sw.js, ...  │
│  - city picker           │           └─────────────────────────────────────────┘
│  - scores + reasons      │   direct  ┌────────────────────────────┐
│  - service worker cache  │──────────▶│ api.open-meteo.com         │  (no key, CORS)
│                          │──────────▶│ marine-api.open-meteo.com  │
│ /agents (Agent Console)  │           └────────────────────────────┘
│  - password login        │   /api/*  ┌─────────────────────────────────────────┐
│  - agent list + chat     │──────────▶│ Netlify Functions (Node, TypeScript)    │
│  - review & Approve      │           │  login · agents · chat (stream)         │
└──────────────────────────┘           │  job-background · job-status            │
                                       │  proposals · approve                    │
                                       │        │            │           │       │
                                       │   Netlify Blobs  Claude API  GitHub API │
                                       └─────────────────────────────────────────┘
                                                                    │ push to main
                                                                    ▼
                                                       Netlify build & redeploy
```

### Weather: browser → Open-Meteo directly

The weather part needs **no server**: Open-Meteo needs no key, so the browser calls it
directly and the service worker caches responses. This keeps the public app free of
function invocations. Optional later: a `/api/forecast` function that caches responses in
Blobs for 15 min per city to stay far below the 10 000 calls/day limit if traffic grows.

### Agent Console: browser → Functions → Claude / GitHub

Everything with a secret lives in functions. See `04-agent-console.md`.

## 3. Proposed repository layout

```
/
├─ public/                    # published as-is (Netlify publish dir)
│  ├─ index.html              # main app
│  ├─ agents/index.html       # Agent Console page
│  ├─ app.js, styles.css, sw.js, manifest.webmanifest
│  ├─ icons/                  # 192, 512, maskable, apple-touch
│  └─ data/cities.json
├─ src/scoring/               # pure scoring functions (also bundled into public/app.js)
├─ netlify/functions/         # login.mts, agents.mts, chat.mts, job-background.mts,
│                             # job-status.mts, proposals.mts, approve.mts, health.mts
├─ netlify/lib/               # auth.ts, allowlist.ts, github.ts, agents.ts, blobs.ts
├─ .claude/agents/*.md        # agent definitions (shown in the console)
├─ tests/                     # vitest unit + playwright e2e
├─ docs/                      # this research
├─ netlify.toml
└─ package.json
```

`netlify.toml` sketch:

```toml
[build]
  publish = "public"
  command = "npm run build"     # can be "echo static" while there is no bundler

[functions]
  node_bundler = "esbuild"
  included_files = [".claude/agents/**"]   # so the agents function can read them

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; connect-src 'self' https://api.open-meteo.com https://marine-api.open-meteo.com; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-Content-Type-Options = "nosniff"
    Permissions-Policy = "geolocation=(self)"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"
```

## 4. Environment variables (all scoped to Functions, all secret-flagged)

| Name | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key — used only inside functions |
| `GITHUB_TOKEN` | Fine-grained PAT, this repo only, Contents read/write |
| `GITHUB_REPO` | `naomild/Flood2` (not secret, but keep alongside) |
| `GITHUB_BRANCH` | `main` |
| `CONSOLE_PASSWORD_HASH` | scrypt/argon2 hash of the console password (never the plain password) |
| `SESSION_SECRET` | 32+ random bytes for signing session cookies |
| `DAILY_TOKEN_BUDGET` | optional spend guard, e.g. `2000000` |

Nothing here is ever sent to the browser. There is no client-side build step that reads
env vars, so nothing can leak into bundles by accident.

## 5. Technology choices

- **Front end:** plain HTML + ES modules (no framework) — smallest, fastest on a phone,
  easiest for agents to edit safely. Add Vite only if the app grows.
- **Functions:** TypeScript (`.mts`), `@netlify/functions` types, `@anthropic-ai/sdk`,
  `@netlify/blobs`. GitHub calls with plain `fetch` (only 3 endpoints needed).
- **Local dev:** `netlify dev` (serves static files + functions + env vars).
