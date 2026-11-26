# Knowledge — `security-engineer`

OWASP password storage, sessions, LLM prompt injection; GitHub fine-grained tokens.

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [github-fine-grained-tokens.md](docs/github-fine-grained-tokens.md) | GitHub fine-grained personal access tokens | docs.github.com |
| [owasp-llm-prompt-injection.md](docs/owasp-llm-prompt-injection.md) | OWASP — LLM Prompt Injection Prevention Cheat Sheet | cheatsheetseries.owasp.org |
| [owasp-password-storage.md](docs/owasp-password-storage.md) | OWASP — Password Storage Cheat Sheet | cheatsheetseries.owasp.org |
| [owasp-session-management.md](docs/owasp-session-management.md) | OWASP — Session Management Cheat Sheet | cheatsheetseries.owasp.org |

## examples/ (worked examples)

- [`01-path-allowlist.mjs`](examples/01-path-allowlist.mjs) — Example 1 — write allow-list for agent proposals, with hostile table-driven tests.
- [`02-password-and-session.mjs`](examples/02-password-and-session.mjs) — Example 2 — console password hash (scrypt, OWASP parameters) and signed session cookie.
- [`03-threat-model-approve.md`](examples/03-threat-model-approve.md) — Example 3 — Threat model: propose → Approve → commit to main

**Run (from `examples/`):** `node 01-path-allowlist.mjs` · `node 02-password-and-session.mjs`

All code examples were run and passed on 2026-11-26. Re-run everything with
`cd knowledge && npm install && npm run verify`.
