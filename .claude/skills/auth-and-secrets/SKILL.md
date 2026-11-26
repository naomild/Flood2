---
name: auth-and-secrets
description: "Owner login (Supabase Auth with Google, D6), the OWNER_EMAILS allow-list, CSRF and secret handling for the Agent Console. Use when writing or reviewing login, token checks or anything that reads a secret."
user-invocable: false
---
# Auth and secrets

Decision D6 (`docs/decisions.md`) replaced the password gate. Detailed rules:
`docs/security/agent-console-auth.md` (Quinn) — read it first; it wins over this summary.

- Login is Supabase Auth with Google, for the owner only. The browser sends the access token as
  `Authorization: Bearer`; every `/api/*` except `health` verifies the JWT server-side and checks
  the verified email against the `OWNER_EMAILS` env var before any side effect.
- The publishable key may be in the browser. No Google client secret and no Supabase service-role
  key in code. No weather or app data in Supabase.
- Never put a real email address in the repo, tests (use `owner@example.com`), docs or logs.
- Rate-limit rules (D4): `/api/chat` and one other; Blobs counters elsewhere.
- CSRF: require `X-Requested-With: console` and check `Origin` matches the site on every POST.
- Secrets live only in Netlify env vars set in the UI/CLI (not `netlify.toml`), read by functions
  with `process.env`; secret-flagged where available. Free plan: scopes can't be restricted, so the
  build must never print or embed them. Never in
  `public/`, responses, logs, error messages, Blobs or commits. Grep before release for
  `sk-ant-`, `ghp_`, `github_pat_`.
- Rotation: GitHub token has an expiry; change `OWNER_EMAILS` to revoke access.
