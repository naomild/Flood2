---
name: auth-and-secrets
description: "Password gate, sessions, CSRF and secret handling for the Agent Console. Use when writing or reviewing login, session checks or anything that reads a secret."
user-invocable: false
---
# Auth and secrets

- One console password, stored only as a scrypt/argon2 hash (`CONSOLE_PASSWORD_HASH`).
  Compare with `crypto.timingSafeEqual`. Same error for every failure.
- Lockout: 5 failures per IP → 15 min, counted in Blobs (`counters`), plus the Netlify
  rate-limit rule on `/api/login` (one of the 2 Free-plan rules, D4).
- Session cookie: `payload.HMAC-SHA256(SESSION_SECRET)`, payload = `{ exp, iat }`;
  `HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=43200`.
- Every `/api/*` except `login` and `health` verifies the session first.
- CSRF: `SameSite=Strict`, require `X-Requested-With: console`, check `Origin` matches
  the site on every POST.
- Secrets live only in Netlify env vars set in the UI/CLI (not `netlify.toml`), read by functions
  with `process.env`; secret-flagged where available. Free plan: scopes can't be restricted, so the
  build must never print or embed them. Never in
  `public/`, responses, logs, error messages, Blobs or commits. Grep before release for
  `sk-ant-`, `ghp_`, `github_pat_`.
- Rotation: GitHub token has an expiry; rotate `SESSION_SECRET` to log everyone out.
