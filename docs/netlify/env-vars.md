# Netlify environment variables (owner: netlify-engineer)

Plan: **Free** (D4). Auth: Supabase + Google (D6). Written 2026-11-26.

> Source status: `docs.netlify.com` could not be reached from the session that wrote this
> page (network allow-list). Facts below come from the team's earlier verified notes
> (`knowledge/netlify-engineer/docs/netlify-environment-variables.md`, read 2026-11-26) and
> are marked **not verified** where they were not re-read. Menu names in the UI steps are
> from memory of the current UI: **not verified**; Netlify may word them differently.

## The variables

| Name | Value | Secret? | Notes |
|---|---|---|---|
| `SUPABASE_URL` | `https://pcmdtscesnxmpuxcizfk.supabase.co` | no | Public. Used by functions to find the project JWKS and check `iss`. |
| `SUPABASE_PUBLISHABLE_KEY` | the project's publishable (anon) key from the Supabase dashboard | no (public by design, D6) | Never use the service-role key anywhere (D6). The browser copy lives in `public/`; this one is for functions if they need it. |
| `OWNER_EMAILS` | the owner's Google address (comma-separated list if more than one) | treat as private; flag secret | Set `OWNER_EMAILS` to the owner's Google address. Never write the real address in the repo, tests, docs or logs. |
| `ANTHROPIC_API_KEY` | Claude API key | **yes** | Money. Set a monthly spend limit in the Claude Console too. |
| `GITHUB_TOKEN` | fine-grained PAT, `naomild/Flood2` only, Contents read/write only (D5) | **yes** | Set an expiry; rotate. |
| `DAILY_TOKEN_BUDGET` | e.g. `2000000` | no | Spend guard; functions read it as a number. |

Also set (from `docs/03-architecture.md` §4, still needed by the GitHub code): `GITHUB_REPO`
= `naomild/Flood2` and `GITHUB_BRANCH` = `main` (not secret). `CONSOLE_PASSWORD_HASH` and
`SESSION_SECRET` are **no longer needed** (superseded by D6); do not create them.

## Steps in the Netlify UI

1. Open the site in Netlify, then **Project configuration** > **Environment variables**
   (not verified: older UI says *Site configuration*).
2. **Add a variable** > **Add a single variable**.
3. Enter the **Key** exactly as in the table (case-sensitive, up to 255 characters).
4. Tick **Contains secret values** for the rows marked secret (see below).
5. Scopes: leave the default (see below). Under **Values**, choose **Same value for all
   deploy contexts**, or set per context (see below).
6. Paste the value (max 5,000 characters) and **Create variable**.
7. Trigger a new deploy: new values reach functions only on the next deploy
   (not verified; redeploy to be safe).
8. Open `/api/health`: it lists which names are set (names only, never values). Check it
   after every change; a secret-flagged variable has been reported missing from the
   functions runtime in one forum case (<https://answers.netlify.com/t/env-vars-flagged-contains-secret-values-not-injected-into-functions-runtime-process-env-non-secret-vars-work-fine-same-deploy/167922>).
   If a secret name shows missing, re-save it and redeploy; if it persists, report to Rio.

CLI alternative (not verified): `netlify env:set NAME value` (add `--secret` for secrets).
Shell history keeps the value, so prefer the UI for secrets.

## Scopes (Functions only where possible)

"By default, environment variables apply to all scopes" (Builds, Functions, Runtime, Post
processing). "On the Pro plan and above, you can set specific scopes"
(<https://docs.netlify.com/build/functions/environment-variables/>, read 2026-11-26).

**On Free we cannot restrict to Functions only.** Every variable above is also visible to
the build. Consequences, enforced in `netlify.toml`: no third-party build plugins; the build
command is just the test run; nothing prints env vars; nothing in `public/` is generated
from env vars. If the plan ever moves to Pro, set Functions-only scope on all six.

## The "secret" flag

Label: **Contains secret values** (Secrets Controller,
<https://docs.netlify.com/build/environment-variables/secrets-controller/>). Effect: value is
write-only in the UI and the build scans output for it. It cannot be un-flagged later
(from a web search summary, not verified). **Free-plan availability: not verified.** A
search summary found Netlify's announcement naming Enterprise and Open Source plans, no
restriction on the current docs page, and one user report of the flag working on a Free site.
Check in the UI: if the checkbox is present on your plan, use it for `ANTHROPIC_API_KEY`,
`GITHUB_TOKEN` and `OWNER_EMAILS`; if not, rely on discipline (no printing, no plugins).
Local-development values cannot be marked secret.

## Deploy contexts

Default is one value for all contexts. Contexts: Production, Deploy Previews, Branch
deploys, Preview server, Local development.

- Production: all six variables.
- Deploy Previews / Branch deploys: Flood has none by design (D3 commits straight to
  `main`), so **do not** give previews the `ANTHROPIC_API_KEY` or `GITHUB_TOKEN`. Choose
  **Different value for each deploy context** and leave non-production empty, or use the
  production-only option if shown (not verified).
- Local development (`netlify dev`): use a separate low-budget Anthropic key, never the
  production `GITHUB_TOKEN`; or leave it unset and use the test fixtures. Tests never call real APIs.
- Note: Supabase redirect URLs must list the site URL `https://my-flood-123.netlify.app/agents`
  (and `http://localhost:8888/agents` for `netlify dev`) in the Supabase dashboard; that is
  Supabase config, not Netlify.

## Rules

- Read in functions with `process.env.NAME`.
- Variables declared in `netlify.toml` are **not available to functions**: do not use it.
- Never return, log or echo values; `/api/health` reports names only.
- Rotate: `GITHUB_TOKEN` at its expiry; `ANTHROPIC_API_KEY` if exposed; changing
  `OWNER_EMAILS` takes effect after redeploy.
