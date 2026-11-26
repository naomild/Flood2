# Decisions

The owner's decisions for Flood. Agents treat these as fixed. Only the project owner can
change one; the orchestrator then records the change here with a new date.

| ID | Date | Decision | Consequences |
|---|---|---|---|
| D1 | 2026-11-26 | **Flood is a PWA on Netlify:** a static front end, Netlify Functions for the Claude and GitHub calls, and **no other servers**. | No databases or servers outside Netlify. State lives in the browser (cache, IndexedDB) or in Netlify Blobs. Weather is fetched by the browser straight from Open-Meteo. |
| D2 | 2026-11-26 | **No rip-current proxy.** The app does not estimate rip-current risk from waves or any other field; it links out to the National Weather Service. | The beach card shows a link to the official NWS surf-zone / rip-current forecast (NWS Miami; NWS Key West for the Keys). Wave height may lower the beach score for comfort only and must not be labelled as rip-current risk. See `01-use-case-and-scoring.md` §4.3. |
| D3 | 2026-11-26 | **Approve commits straight to `main`.** | Each approval is a production deploy. The full diff is shown before Approve; commit SHAs go to the audit log; undo means re-publishing the previous Netlify deploy or approving a revert. No branch / Deploy Preview step. See `04-agent-console.md` §4. |
| D4 | 2026-11-26 | **Stay on the Netlify Free plan for now.** | Verified in Netlify docs on 2026-11-26: background functions (15 min) **are** available on credit-based plans, including Free; failed background runs are retried after 1 min and again 2 min later, so the job runner must be idempotent and must not throw. Free allows only **2 code-based rate-limit rules per project**: use them on `/api/login` and `/api/chat`, and protect other endpoints with the session plus Blobs counters. Keep an eye on the plan's credit usage. See `04-agent-console.md` §5–6. |
| D5 | 2026-11-26 | **Use a fine-grained personal access token** for GitHub commits. | *Only select repositories* → `naomild/Flood2`; **Contents: Read and write** only (Metadata read is automatic); no Workflows, Actions, Secrets or Administration; set an expiry and rotate it. Stored as the secret-flagged `GITHUB_TOKEN` env var, Functions scope only. |

## Sources for D4

- Netlify, *Background Functions overview*: "available on Credit-based plans, including
  Free, Personal, and Pro" and the retry behaviour.
  <https://docs.netlify.com/build/functions/background-functions/>
- Netlify, *Rate limiting* → Availability: "Code-based rules: 2 per project" on Free /
  Starter / Personal. <https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/>
