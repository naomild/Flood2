# Supabase Auth — verifying access tokens server-side (JWT, signing keys, JWKS, claims)

Used by `netlify/lib/auth.ts` (D6). Spec: `docs/security/agent-console-auth.md`.
Pages were fetched with curl as Markdown (`<page>.md`). WebFetch could not resolve `supabase.com`
from this session, but curl through the proxy could.

Sources (all read 2026-11-26):
- *JSON Web Token (JWT)*: <https://supabase.com/docs/guides/auth/jwts>
- *JWT Signing Keys*: <https://supabase.com/docs/guides/auth/signing-keys>
- *JWT Claims Reference*: <https://supabase.com/docs/guides/auth/jwt-fields>
- *Users*: <https://supabase.com/docs/guides/auth/users>
- *Auth identities*: <https://supabase.com/docs/guides/auth/identities>
- *Rate limits*: <https://supabase.com/docs/guides/auth/rate-limits>
- *JavaScript reference* (getClaims, getUser, signOut): <https://supabase.com/llms/js.txt>
- jose `JWTVerifyOptions` / `RemoteJWKSetOptions`:
  <https://github.com/panva/jose/blob/main/docs/jwt/verify/interfaces/JWTVerifyOptions.md>,
  <https://github.com/panva/jose/blob/main/docs/jwks/remote/interfaces/RemoteJWKSetOptions.md>
- **Live project JWKS**: `curl https://pcmdtscesnxmpuxcizfk.supabase.co/auth/v1/.well-known/jwks.json`
  (2026-11-26) returned one key: `{"alg":"ES256","crv":"P-256","kty":"EC","kid":"185e7171-…","use":"sig","key_ops":["verify"]}`.
  Node `createPublicKey({format:"jwk"})` imports it as `ec / prime256v1`. The project's
  `/auth/v1/.well-known/openid-configuration` gives `"issuer":"https://pcmdtscesnxmpuxcizfk.supabase.co/auth/v1"`.
  → **The project uses an asymmetric ES256 key. It is not HS256-only, so the JWKS path applies and the `/auth/v1/user` fallback is not needed for signatures.**

## JWKS (quoted, *JWTs* page)
- "`GET https://project-id.supabase.co/auth/v1/.well-known/jwks.json`" responds "with JWKS object containing
  one or more asymmetric JWT signing keys (only their public keys). Be aware that this endpoint does not
  return any keys if you are not using asymmetric JWT signing keys."
- "cached by the Supabase Edge for 10 minutes … We recommend waiting at least 20 minutes when creating a
  standby signing key, or revoking a previously used key." "Make sure that you do not cache this data for
  longer in your application, as it might make revocation difficult."
- Official jose example: `createRemoteJWKSet(new URL('…/auth/v1/.well-known/jwks.json'))` then `jwtVerify(jwt, PROJECT_JWKS)`.
- HS256 fallback (only if a project has no asymmetric key): "we recommend always verifying a user access
  token directly with the Auth server": `GET …/auth/v1/user` with `apikey: publishable key` and
  `Authorization: Bearer <JWT>`; "If the server responds with HTTP 200 OK, the JWT is valid". Verifying with
  the shared secret: "**We strongly recommend against this approach.**"

## Signing keys (quoted, *Signing keys* page)
- `ES256`: "Elliptic Curves are a faster alternative than RSA". `HS256`: "**Not recommended for production applications.**"
- Revocation and cache: "this multi-level cache is cleared every 20 minutes"; in an urgent revocation
  "your application components may still trust and authenticate JWTs signed with the revoked key" → for
  Flood, **redeploy the functions** after revoking a key (jose's in-memory cache is per instance).
- "It is always prudent to rotate signing keys at least once a year."
- Legacy secret: once migrated, "Plan for revocation of the legacy JWT secret".

## Claims (quoted, *JWT Claims Reference*)
Required claims: `iss` ("`https://project-ref.supabase.co/auth/v1`"), `aud` (`string | string[]`,
"`authenticated`" or "`anon`"), `exp`, `iat`, `sub` (user UUID), `role`, `aal`, `session_id`, `email`, `phone`,
`is_anonymous`. Optional: `jti`, `nbf`, `app_metadata`, `user_metadata`, `amr`.
Anon/service-role API-key tokens use `"iss": "supabase"` and carry `ref` (so an exact `iss` check rejects them).
Validation guidelines: "Check Expiration", "Verify Issuer", "Check Audience", "Always validate the JWT signature before trusting any claims".

**Email-verified finding:** the claims reference lists **no `email_verified` claim** in the access token.
- The *Users* page: `email_confirmed_at` — "If null, it means that the user's email is not confirmed"
  (from `getUser()` / `GET /auth/v1/user`).
- The *Users* page: `user_metadata` — "Do not use it in security sensitive context (such as in RLS policies or
  authorization logic), as this value is editable by the user without any checks." → **never** read
  `user_metadata.email_verified`.
- The *Auth identities* page: Auth links identities with the same email, and "it removes any other unconfirmed
  identities linked to that user" (pre-account-takeover defence).
- `app_metadata.provider`/`providers` is the first and the linked sign-in providers (*Users*). **Not verified:**
  that `app_metadata` cannot be edited by users. It is signed into the token, but no page I read says it is
  admin-only.

## getUser / getClaims / signOut (quoted, JS reference)
- `getUser`: "performs a network request to the Supabase Auth server, so the returned value is authentic".
- `getClaims`: verifies against `/.well-known/jwks.json` locally when the key is asymmetric.
- `signOut`: "There is no way to revoke a user's access token jwt until it expires." Default scope is `'global'`.
- **Not verified:** whether `GET /auth/v1/user` rejects an unexpired access token whose session was signed out.
  Test it by hand (sign out globally, replay the old token, expect a non-200 response).

## Rate limit that shapes the design (quoted, *Rate limits*)
"Sign-ups and sign-ins | `/auth/v1/signup` … `/auth/v1/user` | IP Address | Yes | Defaults to 30 requests
per 5 minutes, with bursts up to 30 requests." Functions share egress IPs, so **do not call `/auth/v1/user`
on every request**. Call it only on low-frequency, high-value endpoints (Approve, job creation).
**Not verified:** whether the limit covers `GET /user` or only `PUT /user`. Plan for the stricter reading.

## jose options used (quoted)
- `algorithms`: "Defaults to all algorithms applicable to the key … Unsecured JWTs (`alg: "none"`) are never accepted." → pin `["ES256"]`.
- `issuer` / `audience`: "Requires the claim to be present."
- `requiredClaims`: issuer, audience, subject and maxTokenAge "independently require `iss`, `aud`, `sub`, and `iat`".
  `exp` is **not** required unless listed → list it.
- `maxTokenAge`: "Maximum time since the JWT `iat`". `clockTolerance`: applies to `nbf`, `exp` and `iat`-with-maxTokenAge.
- `createRemoteJWKSet`: `cacheMaxAge` default 600000 ms, `cooldownDuration` default 30000 ms, `timeoutDuration` default 5000 ms.
- Latest `jose` on npm: 6.2.18 (`npm view jose version`, 2026-11-26).

Worked example with hostile cases: `../examples/04-supabase-owner-check.mjs`.
