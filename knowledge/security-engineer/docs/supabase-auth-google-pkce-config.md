# Supabase Auth — Google login, PKCE vs implicit, redirect URLs, sign-up settings, sessions, API keys

Used by the Agent Console login (D6). Spec: `docs/security/agent-console-auth.md`.
Sources (all read 2026-11-26, fetched as `<page>.md` with curl):
- *Login with Google*: <https://supabase.com/docs/guides/auth/social-login/auth-google>
- *PKCE flow*: <https://supabase.com/docs/guides/auth/sessions/pkce-flow>
- *Implicit flow*: <https://supabase.com/docs/guides/auth/sessions/implicit-flow>
- *Redirect URLs*: <https://supabase.com/docs/guides/auth/redirect-urls>
- *General configuration*: <https://supabase.com/docs/guides/auth/general-configuration>
- *User sessions*: <https://supabase.com/docs/guides/auth/sessions>
- *API keys*: <https://supabase.com/docs/guides/api/api-keys>
- *JavaScript reference*: <https://supabase.com/llms/js.txt> (Initializing, signInWithOAuth, exchangeCodeForSession, signOut)

## Google provider (quoted)
- Google Cloud client: "choose **Web application**". "Under **Authorized JavaScript origins** add your
  application's URL" ("If your app is hosted on `https://example.com/app` add `https://example.com`").
  "Under **Authorized redirect URIs** add your Supabase project's callback URL", which you copy from the Google
  provider page in the dashboard. The local example is `http://127.0.0.1:54321/auth/v1/callback`, so the
  hosted value is expected to be `https://pcmdtscesnxmpuxcizfk.supabase.co/auth/v1/callback`. **Not verified:**
  read the exact value from the dashboard.
- "Remember to remove [localhost] when your application goes into production."
- Scopes: "`openid` (add manually)", "`.../auth/userinfo.email` (added by default)", "`.../auth/userinfo.profile`
  (added by default)". Add nothing else ("might be subject to verification").
- The Client ID and **Client Secret** go into the Supabase dashboard's Google provider page. They never go into
  Netlify or the repo.

## Flow choice (quoted)
- Implicit: redirect "with a URL that looks like `…#access_token=<...>&refresh_token=<...>`"; the libraries
  "Persist this information to local storage".
- PKCE: redirect "`?code=<...>`"; "the code has a validity of 5 minutes and can only be exchanged for an access
  token once"; "The code verifier is created and stored locally when the Auth flow is first initiated … the code
  exchange must be initiated on the same browser and device". Config shown: `flowType: 'pkce'`,
  `detectSessionInUrl: true`, custom `storage` adapter allowed.
- Overlapping flows in two tabs overwrite the verifier ("exchanging the first flow's code fails").
- **Not verified:** the default `flowType` of `createClient` in `supabase-js`. Neither the reference nor the
  guide states it. → **Always set `flowType: 'pkce'` explicitly.**
- Initializing reference: "`auth.persistSession` — Set to `true` if you want to automatically save the user
  session into local storage"; "`auth.detectSessionInUrl` — … automatically detect OAuth grants in the URL".

## Redirect URLs (quoted)
- "The URL in `redirectTo` should match the Redirect URLs list configuration." The Site URL "defines the
  **default redirect URL** when no `redirectTo` is specified".
- Wildcards exist (`*`, `**`, `?`), but "we recommend setting the exact redirect URL path for your site URL in
  production." → Flood: Site URL `https://my-flood-123.netlify.app`, one redirect URL
  `https://my-flood-123.netlify.app/agents`. No wildcards, no `**--…netlify.app`, no localhost.

## Sign-up settings (quoted, *General configuration*)
- "**Allow new users to sign up**: Users will be able to sign up. If this config is disabled, only existing users can sign in."
- "**Allow anonymous sign-ins**", "**Allow manual linking**" are separate switches → both off.
- "**Confirm Email** … Having Confirm Email disabled … implicitly confirms the user's email in the database." →
  turn the Email provider off entirely, since Flood uses Google only.
- **Not verified:** that the sign-up switch also refuses a *first-time Google* user. "Only existing users can
  sign in" implies it does. Test it with a second Google account.

## Sessions (quoted)
- "Access tokens are designed to be short lived, usually between 5 minutes and 1 hour while refresh tokens
  never expire but can only be used once." "Most applications should use the default expiration time of 1 hour."
- Time-boxed sessions, inactivity timeout and single session: "This feature is only available on Pro Plans and up."
- Refresh-token reuse detection revokes the whole session on illegitimate reuse, but "It does not guard against
  the case where a user's session is stolen from their device."
- HTTP-only cookies: "If your app uses any client side JavaScript … using HTTP-Only cookies is not feasible".

## API keys (quoted)
- Publishable key `sb_publishable_...`: "Safe to expose online: web page, mobile or desktop app, GitHub actions,
  CLIs, source code." It does not protect against "Cross-site request forgery, cross-site scripting, phishing attacks."
- "Supabase is deprecating the `anon` and `service_role` keys in early 2027." Do not use either.
- Secret key `sb_secret_...`: "must only be used in a secure server environment". **Flood needs none.**
