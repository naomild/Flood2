---
name: netlify-blobs
description: "How Flood stores state in Netlify Blobs: stores, keys, consistency and conditional writes. Use for jobs, proposals, sessions, counters and audit logs."
user-invocable: false
---
# Netlify Blobs

Docs: https://docs.netlify.com/build/data-and-storage/netlify-blobs/

```ts
import { getStore } from "@netlify/blobs";
const jobs = getStore({ name: "jobs", consistency: "strong" });
await jobs.setJSON(`jobs/${id}`, job, { onlyIfNew: true });
const j = await jobs.get(`jobs/${id}`, { type: "json" });
```

- Default consistency is **eventual** (up to 60 s). Use `consistency: "strong"` for
  anything polled or racing: job status, proposals, counters, lockouts.
- Conditional writes: `onlyIfNew` to create once; `onlyIfMatch: etag` to claim a job or
  move a proposal from `pending` → `committed` exactly once.
- Site-wide stores (`getStore`) persist across deploys — use them (not deploy stores).
- Limits: store name ≤ 64 bytes, key ≤ 600 bytes, metadata ≤ 2 KB.

## Stores
`jobs` · `proposals` · `audit` (append-only, key by ISO time) · `counters`
(per-day usage, login failures) · `sessions` only if revocation is needed.
Never store secrets or the owner's email address.
