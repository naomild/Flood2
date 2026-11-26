# Supabase Auth (Google) for the Agent Console — research status

Context: owner decision D6 (`docs/decisions.md`, 2026-11-26).

**Not verified (2026-11-26):** `supabase.com` could not be reached from the orchestrator's
session (DNS blocked by the session's network allow-list), so nothing below is from an
official page yet. Whoever builds or reviews the login must read these pages first and cite
them with read dates:

| Topic | Official page to read | What to confirm |
|---|---|---|
| Google provider setup | <https://supabase.com/docs/guides/auth/social-login/auth-google> | Google Cloud OAuth client type, the exact authorised redirect URI (expected `https://pcmdtscesnxmpuxcizfk.supabase.co/auth/v1/callback`), consent-screen scopes |
| `signInWithOAuth` | <https://supabase.com/docs/reference/javascript/auth-signinwithoauth> | `options.redirectTo`, PKCE vs implicit flow default in the browser |
| JWTs and JWKS | <https://supabase.com/docs/guides/auth/jwts> | JWKS path (expected `/auth/v1/.well-known/jwks.json`), signing algorithm, `iss` value (expected `https://pcmdtscesnxmpuxcizfk.supabase.co/auth/v1`), whether an `email_verified` claim exists or it lives in `user_metadata` |
| Redirect URLs | <https://supabase.com/docs/guides/auth/redirect-urls> | Site URL and the redirect allow-list format |
| Disable sign-ups | Supabase dashboard → Authentication settings | Exact name of the "allow new users to sign up" switch and whether it blocks first-time OAuth users |
| API keys | <https://supabase.com/docs/guides/api/api-keys> | Publishable key (`sb_publishable_…`) is safe in the browser |

Orchestrator lesson: when running as a subagent without the `Agent` tool, the orchestrator
cannot delegate; record owner decisions, write the briefs, and hand back instead of doing
specialist work.
