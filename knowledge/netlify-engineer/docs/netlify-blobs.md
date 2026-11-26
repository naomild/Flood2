# Netlify Blobs

Source: *Netlify Blobs* — <https://docs.netlify.com/build/data-and-storage/netlify-blobs/> (read 2026-11-26)

```ts
import { getStore } from "@netlify/blobs";
const store = getStore(name, { region, siteID, token }); // or getStore({ name, consistency })
await store.set(key, value, { metadata, onlyIfMatch, onlyIfNew });
await store.setJSON(key, value, { metadata, onlyIfMatch, onlyIfNew });
const entry = await store.get(key, { type: "json" }); // arrayBuffer | blob | stream | text (default)
await store.delete(key);
await store.list({ directories, paginate, prefix });
```
- `onlyIfMatch`: "the write will only succeed if the entry exists and has an ETag matching
  this value". `onlyIfNew`: "only succeed if the entry does not exist".
- Consistency: **eventual by default** — "Updates and deletions propagate to all edge
  locations within 60 seconds." **Strong** at store level
  (`getStore({ name: "animals", consistency: "strong" })`) or per call
  (`store.get("dog", { consistency: "strong" })`): "updates/deletions become immediately
  available to all readers".
- Limits: store name ≤ 64 bytes; key ≤ 600 bytes; object ≤ 5 GB; metadata ≤ 2 KB.
- `getStore` = site-wide (persists across deploys); `getDeployStore` = tied to one deploy.
  Flood uses site-wide stores with strong consistency for jobs, proposals, counters, audit.
