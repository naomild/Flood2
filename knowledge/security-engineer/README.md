# Knowledge — `security-engineer`

Supabase Auth (Google, PKCE, JWT/JWKS verification) for the Agent Console (D6); OWASP LLM prompt injection;
GitHub fine-grained tokens; Netlify function env and AI Gateway. The password and session-cookie material
is **superseded by D6** and kept for reference only. Spec: `docs/security/agent-console-auth.md`.

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [github-fine-grained-tokens.md](docs/github-fine-grained-tokens.md) | GitHub fine-grained personal access tokens | docs.github.com |
| [owasp-llm-prompt-injection.md](docs/owasp-llm-prompt-injection.md) | OWASP — LLM Prompt Injection Prevention Cheat Sheet | cheatsheetseries.owasp.org |
| [owasp-password-storage.md](docs/owasp-password-storage.md) | OWASP — Password Storage Cheat Sheet (*superseded by D6*) | cheatsheetseries.owasp.org |
| [owasp-session-management.md](docs/owasp-session-management.md) | OWASP — Session Management Cheat Sheet (cookie parts *superseded by D6*) | cheatsheetseries.owasp.org |
| [supabase-auth-jwt-verification.md](docs/supabase-auth-jwt-verification.md) | Supabase JWTs, signing keys, JWKS, claims, email-verified, `/user` rate limit; jose options; live project JWKS = ES256 | supabase.com, github.com/panva/jose, project JWKS |
| [supabase-auth-google-pkce-config.md](docs/supabase-auth-google-pkce-config.md) | Google provider, PKCE vs implicit, redirect URLs, sign-up settings, sessions, API keys | supabase.com |
| [netlify-ai-gateway-and-function-env.md](docs/netlify-ai-gateway-and-function-env.md) | Function env redeploy rule; AI Gateway auto-injected `ANTHROPIC_*` keys | docs.netlify.com |

## examples/ (worked examples)

- [`01-path-allowlist.mjs`](examples/01-path-allowlist.mjs) — Example 1 — write allow-list for agent proposals, with hostile table-driven tests.
- [`02-password-and-session.mjs`](examples/02-password-and-session.mjs) — Example 2 — console password hash and signed session cookie (*superseded by D6*).
- [`03-threat-model-approve.md`](examples/03-threat-model-approve.md) — Example 3 — Threat model: propose → Approve → commit to main (rows 1–3 updated for D6)
- [`04-supabase-owner-check.mjs`](examples/04-supabase-owner-check.mjs) — Example 4 — Supabase access-token + `OWNER_EMAILS` + Origin gate, 39 hostile cases.

**Run (from `examples/`):** `node 01-path-allowlist.mjs` · `node 02-password-and-session.mjs` · `node 04-supabase-owner-check.mjs`

All code examples were run and passed on 2026-11-26. (`04-…` is not yet listed in `knowledge/run-all.sh`;
agent-builder or the orchestrator should add `run security-engineer/examples/04-supabase-owner-check.mjs`.) Re-run everything with
`cd knowledge && npm install && npm run verify`.
