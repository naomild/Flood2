# ADR 2: Long agent jobs run in idempotent background functions

**Status:** Accepted (2026-11-26)

## Context
Synchronous and streaming Netlify Functions stop at 60 s; background functions run up to 15 min,
return 202 immediately, and are available on the Free plan; on error Netlify retries after 1 min and
again 2 min later (Netlify Functions docs). Agent tasks that read several files and propose changes
often exceed 60 s. A retried run would call the Claude API again and spend tokens twice. Netlify
Blobs reads are eventually consistent (≤ 60 s) unless strong consistency is requested, and writes can
be conditional (`onlyIfNew`, `onlyIfMatch`).

## Decision
We will keep chat turns in a streaming function capped at ~45 s, and run longer work as a job:
`/api/jobs` writes `jobs/<id>` with `onlyIfNew`, then invokes `/api/job-run` (background). The runner
claims the job with `onlyIfMatch`, exits unless the status is `queued` or `resuming`, saves progress
after every model response, stops at ~13 min with `status: "paused"`, and catches every error
(recording `failed`) instead of throwing. The page polls `/api/jobs/:id` with strong reads.

## Consequences
- Positive: long tasks fit the platform; retries can't double-spend; progress survives a crash.
- Negative: polling instead of streaming for jobs; more states to test (queued, running, paused,
  done, failed, lost-race).
- Neutral: if Netlify adds streaming for background functions, revisit.
