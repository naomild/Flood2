---
name: netlify-functions
description: "How Flood writes Netlify Functions: syntax, time limits, streaming, background jobs, rate limits on the Free plan. Use when writing or reviewing anything in netlify/functions."
user-invocable: false
---
# Netlify Functions

Docs: https://docs.netlify.com/build/functions/overview/ · …/functions/api/ ·
…/functions/background-functions/ · …/manage/security/secure-access-to-sites/rate-limiting/

```ts
import type { Config, Context } from "@netlify/functions";
export default async (req: Request, context: Context) => new Response("ok");
export const config: Config = { path: "/api/example" };
```

## Limits
- Sync and streaming: **60 s**; streaming responses ≤ 20 MB.
- Background (`config.background = true`): **15 min**, caller gets **202** at once.
  On error Netlify **retries after 1 min, then 2 min** → job runners must be idempotent,
  catch everything, record failure in Blobs and never throw.
- Scheduled: 30 s — not for agent work.

## Free plan (D4)
Only **2 code-based rate-limit rules per project**: `/api/login` and `/api/chat`
(`rateLimit: { windowLimit, windowSize ≤ 180, aggregateBy: ["ip","domain"] }`).
Rate limits for functions can't go in `netlify.toml`. Other endpoints: session check +
Blobs counters.

## Rules
- Read env with `process.env.NAME` (as Netlify's functions env-var docs show); vars from
  `netlify.toml` are not available to functions. Never return or log secrets.
- Validate method, content type and body size first; return JSON errors with status codes.
- Bundle `.claude/agents/**` via `included_files` when a function reads them.
- Each function is a thin handler; logic lives in `netlify/lib/` and is unit-tested.
