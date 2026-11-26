# 04 · Agent Console (in the deployed app)

A password-protected page at `/agents` that:

1. lists every agent defined in `.claude/agents/*.md` with its **name, model and
   personality**;
2. lets the user **chat** with any agent (Claude API is called only from a Netlify
   Function; the key lives in an environment variable);
3. lets an agent **propose code changes**, which are committed to GitHub **only after the
   user clicks Approve** — the push to `main` triggers a Netlify redeploy.

Researched 2026-11-26 from the Claude API docs (Messages API, models, tool use,
streaming — via the bundled Claude API reference), Netlify docs (see `03-architecture.md`)
and the GitHub REST docs for repository contents and fine-grained tokens.

## 1. Agent definitions

Claude Code sub-agents are Markdown files with YAML front matter:

```markdown
---
name: ui-designer-apple-liquid-glass
description: "Sable, the Apple-style UI designer (Liquid Glass). Use for visual design..."
tools: Read, Grep, Glob, Edit, Write, WebFetch, WebSearch
model: sonnet          # alias: opus | sonnet | haiku | inherit, or a full model ID
skills:
  - liquid-glass-visual-design
  - accessibility-wcag
color: pink
---
You are **Sable**, the Flood team's visual designer...

## Persona
Calm, exacting, quietly opinionated...
```

The `agents` function reads them (bundled via `included_files = [".claude/agents/**"]`),
parses the front matter and returns `{ id, name, description, model, skills, personality }`.
`personality` is the `## Persona` section when the agent has one (Sable, Wren), otherwise
the first paragraph of the body. The whole body becomes the system prompt in chat; the
agent's `skills` can be appended from `.claude/skills/<name>/SKILL.md` (bundle that folder
with `included_files` too). The real definitions are in `.claude/agents/` (12 agents).

Model alias → Claude API model ID (current models as of 2026-11; check
`GET /v1/models` at startup rather than hard-coding forever):

| Alias in file | API model ID | Notes |
|---|---|---|
| `opus`, `inherit`, missing | `claude-opus-5-5` | default; $4 / $20 per M tokens |
| `sonnet` | `claude-sonnet-5-5` | $2 / $10 |
| `haiku` | `claude-haiku-5-5` | cheapest; good for "explain this" chat |
| full ID (e.g. `claude-opus-5-5`) | as given | validate against an allow-list of IDs |

## 2. Claude API usage (from the official API reference)

- SDK: `npm install @anthropic-ai/sdk`; `const client = new Anthropic()` reads
  `ANTHROPIC_API_KEY` from the function environment. One endpoint: `POST /v1/messages`.
- **Streaming** for chat: `client.messages.stream({...})`, iterate events and forward
  `content_block_delta`/`text_delta` to the browser as Server-Sent Events; use
  `await stream.finalMessage()` when the whole message is needed.
- **Thinking/effort on Claude Opus 5.5:** thinking is always adaptive (sending
  `{type:"disabled"}` or `budget_tokens` is a 400). Control cost/latency with
  `output_config: { effort: "low" | "medium" | "high" | "xhigh" | "max" }`; the default
  is `medium`, so set it explicitly — `low` for quick chat, `high` for code proposals.
- **Tool use:** define tools with `name`, `description`, `input_schema`, and
  `strict: true` (+ `additionalProperties: false`). Forced `tool_choice` (`any`/`tool`)
  returns a 400 on Opus 5.5 / Sonnet 5.5 — use `auto` and say in the system prompt when
  to call the tool. Parse tool inputs as JSON, validate them against the schema before
  running anything, and return all `tool_result` blocks for one turn in a single user
  message. When streaming with client tools, set `eager_input_streaming: true` on each
  tool and validate the (possibly truncated) input yourself.
- **Refusals:** always check `stop_reason` before reading content; handle `"refusal"`.
  For Opus 5.5 / Sonnet 5.5 use the server-side fallback
  (`betas: ["server-side-fallback-2026-07-01"], fallbacks: "default"` on
  `client.beta.messages.*`). Haiku 5.5 has no server-side fallback.
- **Prompt caching:** put the agent's system prompt and tool list first and mark them with
  `cache_control: {type:"ephemeral"}`; never put timestamps in the system prompt.
- Do not use assistant prefill (400 on current models).
- `max_tokens`: ~16 000 for non-streaming, up to 64 000 when streaming.

### Tools the agents get

| Tool | Input | What the function does |
|---|---|---|
| `list_files` | `{ dir }` | Lists repo paths via GitHub *Get repository content* (read-only), filtered to readable paths |
| `read_file` | `{ path }` | Returns file text from GitHub (≤ 1 MB) for allow-listed readable paths |
| `propose_change` | `{ path, new_content, summary }` | **Does not write.** Validates path + size, stores a proposal in Blobs, returns a proposal ID. The UI shows a diff with Approve / Reject |

Agents never receive a tool that commits. Committing is a separate, human-only endpoint.

## 3. Endpoints

| Path | Method | Type | Job |
|---|---|---|---|
| `/api/login` | POST | sync | Check password (timing-safe compare against `CONSOLE_PASSWORD_HASH`), set session cookie |
| `/api/logout` | POST | sync | Clear cookie |
| `/api/agents` | GET | sync | List agents |
| `/api/chat` | POST | **streaming** (≤60 s) | One conversational turn incl. short tool loops |
| `/api/jobs` | POST | sync | Create a long job, kick the background function, return `jobId` |
| `/api/job-run` | POST | **background** (≤15 min) | Run the multi-step agent loop, write progress to Blobs |
| `/api/jobs/:id` | GET | sync | Poll job status/progress/output |
| `/api/proposals` | GET | sync | List pending proposals with diffs |
| `/api/proposals/:id/approve` | POST | sync | Re-validate and commit to GitHub |
| `/api/proposals/:id/reject` | POST | sync | Mark rejected |
| `/api/health` | GET | sync | Names of configured env vars, no values |

All except `/api/login` and `/api/health` require a valid session.

## 4. Approve → commit → redeploy (GitHub REST)

*Create or update file contents*: `PUT /repos/{owner}/{repo}/contents/{path}`
(<https://docs.github.com/en/rest/repos/contents>), headers
`Accept: application/vnd.github+json`, `Authorization: Bearer $GITHUB_TOKEN`,
`X-GitHub-Api-Version: 2026-03-10` (the version shown on the docs page — confirm).
Body: `message`, `content` (Base64), `branch`, and **`sha`** of the file being replaced
(from `GET .../contents/{path}`; omit for new files). Optional `committer`/`author`.
Token permission: fine-grained **Contents: write** (plus **Workflows: write** only for
`.github/workflows` files — we deliberately do *not* grant it).

Rules from the docs that matter:

- Create/update and delete **must run serially**; parallel calls conflict.
- ≤1 MB files get full support; this is plenty for source files.

Approve flow:

1. Load proposal from Blobs; check status is `pending` (use `onlyIfMatch` ETag so a
   double-click can't commit twice).
2. Re-run the path allow-list and size checks (never trust the stored proposal).
3. `GET` the file's current `sha`; if it differs from the `base_sha` captured when the
   proposal was made, mark it **stale** and ask the agent to regenerate (prevents
   overwriting someone else's change).
4. `PUT` the file with message `"agent(<name>): <summary>\n\nApproved-by: console"`.
5. Store the returned commit SHA on the proposal; status `committed`.
6. Netlify builds automatically on push to `main`; the UI links to the commit and shows
   "deploying…". (Optional: poll the Netlify deploy status with a Netlify token — extra
   secret, phase 2.)

Multi-file proposals: the contents endpoint makes **one commit per file**. For atomic
multi-file changes use the Git Data API (create blobs → tree → commit → update ref) — read
those docs before building it. Start with single-file proposals.

**Decided (D3):** Approve commits **straight to `main`**, so every approval is a
production deploy. Because of that:

- the diff shown before Approve must be the complete, final file content;
- after each commit the UI shows the commit link and "deploying…", and the audit log
  keeps the commit SHA;
- to undo, either re-publish the previous deploy from Netlify's deploy list, or approve a
  revert proposal (the previous file content, re-checked against the current `sha`).

The branch + Deploy Preview flow was considered and not chosen.

## 5. Security

### 5.1 Threat model in one paragraph

The deployed site is public. Anyone can reach `/agents` and `/api/*`. The two secrets
(Anthropic key = money; GitHub token = write access to the code that runs the site) must
never reach a browser, and an attacker — or a prompt-injected agent — must not be able to
change code without the owner's approval, spend unlimited money, or change the security
code itself.

### 5.2 Controls

| Control | Implementation |
|---|---|
| **Password gate** | One console password, stored only as a scrypt/argon2 hash in `CONSOLE_PASSWORD_HASH`. `crypto.timingSafeEqual` compare. On success set cookie `session=<payload>.<HMAC-SHA256(SESSION_SECRET)>` with `HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=43200`. Lock out after 5 failures per IP for 15 min (counter in Blobs) in addition to Netlify rate limiting |
| **CSRF** | `SameSite=Strict` + require header `X-Requested-With: console` and check `Origin` equals the site URL on every POST |
| **Least-privilege GitHub token** | Fine-grained PAT: *Only select repositories* → this one repo; permissions **Contents: Read and write** (Metadata: read is automatic); **no** Workflows, Administration, Secrets, Actions. Set an expiration (e.g. 90 days) and a calendar reminder. Docs: <https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens> |
| **Path allow-list** (writes) | Allow: `public/**` (except `public/_headers`, `public/_redirects`), `src/**`, `tests/**`, `docs/**`, `.claude/agents/**` (optional). Deny always: `netlify/**`, `netlify.toml`, `package.json`, `package-lock.json`, `.github/**`, `.env*`, `_headers`, `_redirects`, any path with `..`, leading `/`, backslashes, or control chars. Normalize with `path.posix.normalize` and compare against the normalized form. Unit-test this file heavily |
| **Read allow-list** | Same as write plus read-only `README.md`; never `netlify/lib/auth.ts`-style secrets (there are none in the repo, but keep reads scoped anyway) |
| **Content checks** | Text only (UTF-8), ≤ 200 KB per file, ≤ 5 files per proposal; reject content containing likely secrets (`sk-ant-`, `ghp_`, `github_pat_` patterns) |
| **Human in the loop** | Agents can only *propose*. The diff is shown in full; Approve is a separate request requiring the session |
| **No secrets in the browser** | Keys only in function env vars (secret-flagged, Functions scope); responses never echo env; CSP `connect-src 'self'` + Open-Meteo only |
| **Rate limits** | The Netlify Free plan allows **2 code-based rate-limit rules per project** (D4). Use them on `/api/login` (5 per 60 s per IP) and `/api/chat` (10 per 60 s per IP). Protect `/api/jobs`, approve and reject with the session check plus per-day counters in Blobs (e.g. 20 jobs/day, 50 approvals/day) |
| **Spend guard** | Per-day token counter in Blobs (sum `usage.input_tokens + output_tokens`); refuse when over `DAILY_TOKEN_BUDGET`. Also set a monthly spend limit in the Claude Console |
| **Prompt injection** | File contents and web data are untrusted. The system prompt says so; tool outputs are wrapped as data; the allow-list and human approval are the real defence, not the prompt |
| **Audit log** | Append every login, proposal, approval and commit SHA to a Blobs `audit` store |
| **Model allow-list** | Only the model IDs in the table above can be requested; reject others |

## 6. Long agent jobs vs Netlify time limits

| Limit | Implication |
|---|---|
| Sync/streaming function: **60 s** | One chat turn plus a few quick tool calls fits. A multi-file code task usually does not |
| Background function: **15 min**, returns 202 immediately, can't stream to the client | Use it for "go implement X" jobs |
| Scheduled: 30 s | Not for agent work |

Design:

1. **Chat** (`/api/chat`, streaming): cap each turn at ~45 s of wall-clock. Use
   `effort: "low"` or `"medium"`. If the agent's tool loop is still running near the cap,
   stop, save the conversation to Blobs and reply "This needs a longer job — Start job?".
2. **Jobs** (`/api/jobs` → `/api/job-run` background):
   - `/api/jobs` writes `{status:"queued", agent, messages}` to Blobs key `jobs/<id>`
     and calls the background function with an internal secret header; returns `jobId`.
   - `/api/job-run` runs the tool loop, writing progress after every model response
     (`status`, `step`, last text, proposal IDs). Stop at ~13 min, save the full
     `messages` array (including tool results — append `response.content` unchanged),
     and mark `status:"paused"` so the user can click *Continue* to resume in a new
     background run.
   - The page polls `/api/jobs/:id` every 2–3 s (Blobs reads with
     `consistency: "strong"` so progress is not 60 s stale).
3. Optionally use the API's **task budget** (beta) so the model paces itself, and
   **compaction** (beta) for very long conversations — read the docs first.

**Free plan (D4):** background functions are available on credit-based plans, including
Free (Netlify docs, *Background Functions overview*). The same page says that if the
invocation returns an error, Netlify **retries after one minute, and again two minutes
later**. A retried agent run would spend tokens twice, so `/api/job-run` must:

- catch every error, write `status:"failed"` with the reason to Blobs, and finish without
  throwing (no retry);
- check the job's status at start and exit at once unless it is `queued` or
  `resuming` (a retry of a job that already ran does nothing);
- claim the job with a conditional Blobs write (`onlyIfMatch` on the ETag) so two runs
  can't process the same job.

## 7. Decided and still open

Decided (see `decisions.md`): commit straight to `main` (D3); Netlify Free plan (D4);
fine-grained personal access token (D5).

Still open:

- Single password vs Netlify Identity / OAuth (single password is simplest for one user).
- Whether `.claude/agents/**` should itself be editable by agents through the console
  (it changes their own prompts — default **no**; in the repo only `agent-builder` edits
  them).
