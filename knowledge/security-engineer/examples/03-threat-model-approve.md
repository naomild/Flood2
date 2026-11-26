# Example 3 — Threat model: propose → Approve → commit to main

Method: list assets, entry points, abuse cases, and the control (with its test) for each. Sources:
OWASP LLM Prompt Injection, Session Management and Password Storage cheat sheets; GitHub
fine-grained token docs (all in `../docs/`); decisions D3 (commit to main), D4 (Free plan), D5 (PAT).

**Assets:** `ANTHROPIC_API_KEY` (money) · `GITHUB_TOKEN` (write access to the live app) · the live
app itself · the owner's session.
**Entry points:** (D6: `/api/login` removed; Supabase Google sign-in in the browser) `/api/chat`, `/api/jobs`, `/api/proposals/:id/approve`, files the
agent reads (indirect injection), agent definition files.

| # | Abuse case | Control | Verified by |
|---|---|---|---|
| 1 | *(D6)* Stranger signs in with Google | Supabase sign-ups off; JWT verified (ES256 JWKS, iss/aud/exp); `OWNER_EMAILS` → 403 | `04-supabase-owner-check.mjs` |
| 2 | *(D6)* Stolen/forged access token | ES256 only, `maxTokenAge` 1 h, sessionStorage, global sign-out, strict `/auth/v1/user` re-check on Approve | `04-supabase-owner-check.mjs` |
| 3 | CSRF approve from another site | *(D6)* Bearer header only (no cookies), no CORS headers, `Origin` must equal the site | `04-supabase-owner-check.mjs` CSRF rows |
| 4 | Prompt-injected agent proposes `netlify/functions/approve.mts` to remove checks | write allow-list denies `netlify/**`, config, workflows, `.claude/**`; re-checked at Approve | `01-path-allowlist.mjs` |
| 5 | Agent hides a secret-exfiltration script in `public/app.js` | owner sees full diff before Approve (D3); CSP `connect-src` limits where the page can send data; content scan for secret patterns | review checklist; CSP header test |
| 6 | Token leak → attacker edits other repos | fine-grained PAT, *Only select repositories* = Flood2, Contents only, expiry 90 days | GitHub token settings screenshot in release checklist |
| 7 | Token leak → attacker edits workflows to steal more secrets | no Workflows permission; `.github/**` denied | `01-path-allowlist.mjs` |
| 8 | Runaway spend (loops, abuse) | Netlify rate-limit rules on `/api/chat` and `POST /api/jobs` (D6); daily token budget in Blobs; Console spend limit; `maxSteps` | function test: budget exceeded → 429 |
| 9 | Background job retried after an error re-spends tokens (D4) | job claims with `onlyIfMatch`; exits unless `queued`; catches all errors | netlify-engineer `03-idempotent-background-job.mjs` |
| 10 | Secrets visible to build (Free plan can't scope env vars) | no build plugins, no env printing, nothing in `public/` built from env | build log review; grep `public/` for `sk-ant-`, `github_pat_` |
| 11 | Double-click approve → two commits / race | proposal status `pending` → `committed` with conditional write; button disabled | agent-console `03-approve-commit.mjs` ("skipped") |
| 12 | Approving a stale proposal overwrites newer work | compare `base_sha` with current `sha`; 409 → stale | agent-console `03-approve-commit.mjs` |

**Residual risk (accepted by D3):** a subtly malicious but allow-listed change approved by the owner
goes live. Mitigation: small diffs, review checklist, one-click rollback in Netlify.
