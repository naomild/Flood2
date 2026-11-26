// Example 3 — background job runner that survives Netlify's automatic retries (D4).
// Netlify: background functions get a 202 immediately; "If function invocation returns an error,
// a retry happens after one minute. If it fails again, another retry happens two minutes later."
// Blobs semantics used (from @netlify/blobs 11.1.11 types and the Blobs docs): getWithMetadata()
// returns { data, etag }; setJSON(..., { onlyIfMatch }) returns { modified:false } on a lost race.
// The store here is an in-memory stand-in with those semantics. Run: node 03-idempotent-background-job.mjs
import assert from "node:assert/strict";

export function memoryStore() {               // stand-in for getStore({ name: "jobs", consistency: "strong" })
  const m = new Map(); let n = 0;
  return {
    async getWithMetadata(key) { const e = m.get(key); return e ? { data: structuredClone(e.data), etag: e.etag, metadata: {} } : null; },
    async setJSON(key, data, opts = {}) {
      const cur = m.get(key);
      if (opts.onlyIfNew && cur) return { modified: false };
      if (opts.onlyIfMatch && (!cur || cur.etag !== opts.onlyIfMatch)) return { modified: false };
      const etag = `"e${++n}"`; m.set(key, { data: structuredClone(data), etag }); return { modified: true, etag };
    },
  };
}

/** The background function body. Never throws (a throw would trigger a paid retry). */
export async function runJob(store, jobId, work, runId) {
  const key = `jobs/${jobId}`;
  try {
    const entry = await store.getWithMetadata(key);
    if (!entry) return "missing";
    if (!["queued", "resuming"].includes(entry.data.status)) return `skip:${entry.data.status}`; // retry of a finished/running job
    const claim = await store.setJSON(key, { ...entry.data, status: "running", runId }, { onlyIfMatch: entry.etag });
    if (!claim.modified) return "lost-race";                    // another run claimed it first
    let etag = claim.etag, job = { ...entry.data, status: "running", runId };
    const progress = async (patch) => {
      job = { ...job, ...patch };
      const w = await store.setJSON(key, job, { onlyIfMatch: etag });
      if (w.modified) etag = w.etag;
    };
    const result = await work(progress);
    await progress({ status: "done", result });
    return "done";
  } catch (err) {
    const cur = await store.getWithMetadata(key).catch(() => null);
    if (cur) await store.setJSON(key, { ...cur.data, status: "failed", error: String(err.message ?? err) }).catch(() => {});
    return "failed";                                             // returned, not thrown → no retry
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const store = memoryStore();
  await store.setJSON("jobs/j1", { status: "queued", agent: "qa-engineer" }, { onlyIfNew: true });
  let calls = 0;
  const work = async (progress) => { calls++; await progress({ step: 1 }); return "proposal p_9"; };

  // Two invocations race (e.g. a retry overlapping the first run): exactly one does the work.
  const [a, b] = await Promise.all([runJob(store, "j1", work, "run-A"), runJob(store, "j1", work, "run-B")]);
  assert.deepEqual([a, b].sort(), ["done", "lost-race"]);
  assert.equal(calls, 1, "tokens spent once");
  assert.equal(await runJob(store, "j1", work, "run-C"), "skip:done");   // a late retry does nothing
  assert.equal(calls, 1);

  await store.setJSON("jobs/j2", { status: "queued" }, { onlyIfNew: true });
  const boom = async () => { throw new Error("Claude API 529 overloaded"); };
  assert.equal(await runJob(store, "j2", boom, "run-D"), "failed");     // no throw → Netlify won't retry
  const j2 = (await store.getWithMetadata("jobs/j2")).data;
  assert.equal(j2.status, "failed");
  assert.match(j2.error, /529/);
  assert.equal(await runJob(store, "j2", boom, "run-E"), "skip:failed"); // user must click Retry to re-queue
  console.log("03-idempotent-background-job: all checks passed");
}
