# Netlify Functions — syntax, limits, Context, background, rate limits

Sources (read 2026-11-26):
- *Functions overview* — <https://docs.netlify.com/build/functions/overview/>
- *Functions API reference* — <https://docs.netlify.com/build/functions/api/>
- *Configuration for functions* — <https://docs.netlify.com/build/functions/configuration/>
- *Background Functions overview* — <https://docs.netlify.com/build/functions/background-functions/>
- *Scheduled Functions* — <https://docs.netlify.com/build/functions/scheduled-functions/>
- *Rate limiting* — <https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/>

## Signature
```ts
import type { Config, Context } from "@netlify/functions";
export default async (req: Request, context: Context) => new Response("Hello, world!");
export const config: Config = { path: "/hello" };
```
Web-standard `Request` in, `Response` out. Default directory `netlify/functions/`.

## Limits
| Setting | Value | Configurable |
|---|---|---|
| Synchronous execution | **60 s** | No |
| Streaming | 60 s execution, **20 MB** response | — |
| Background execution | **15 min** | No |
| Scheduled | "30 second execution limit" | — |

## Background functions
```ts
export default async (req: Request) => { /* client already received 202 */ };
export const config: Config = { background: true, path: "/process" };
```
"available on Credit-based plans, including Free, Personal, and Pro". "If function invocation
returns an error, a retry happens after one minute. If it fails again, another retry happens
two minutes later." → must be idempotent.

## Context object (API reference headings)
`account`, `cookies`, `deploy`, `geo`, `ip` ("A string containing the client IP address"),
`params`, `requestId` (e.g. `01FDWR77JMF2DA1CHF5YA6H07C`), `server`, `site`, `user`,
`waitUntil`. `context.waitUntil()` extends execution "without blocking the response to the
client" — but the time still counts toward the execution limit and billing.

## Config object (API reference headings)
`background`, `excludedPath`, `method`, `memory`, `path`, `preferStatic`, `rateLimit`,
`region`, `schedule`, `vcpu`.

## rateLimit
```ts
export const config: Config = {
  path: "/api/chat",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
```
`action`: `"rate_limit"` (429) or `"rewrite"` (with `to`). `windowSize` max 180 s.
"rate limits for functions cannot be defined in the `netlify.toml` configuration file."
**Free / Starter / Personal: 2 code-based rules per project**; Pro: 5.
