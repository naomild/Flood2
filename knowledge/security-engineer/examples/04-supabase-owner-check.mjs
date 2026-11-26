// Example 4 — Supabase access-token check for the Agent Console (D6), with hostile table-driven tests.
// Run: node 04-supabase-owner-check.mjs   (Node built-ins only)
//
// Production netlify/lib/auth.ts uses `jose` (createRemoteJWKSet + jwtVerify) as Supabase's JWT guide
// shows; this file re-implements the same POLICY with node:crypto so it runs without dependencies and
// so the hostile cases below can be copied into tests/security/auth.test.ts.
// Sources (read 2026-11-26), see ../docs/supabase-auth-jwt-verification.md:
//   https://supabase.com/docs/guides/auth/jwts · /auth/signing-keys · /auth/jwt-fields · /auth/users
//   jose JWTVerifyOptions: https://github.com/panva/jose/blob/main/docs/jwt/verify/interfaces/JWTVerifyOptions.md
// The project JWKS (curl 2026-11-26) has one key: kty EC, crv P-256, alg ES256 → pin algorithms to ES256.
import assert from "node:assert/strict";
import { generateKeyPairSync, createPublicKey, sign as cSign, verify as cVerify } from "node:crypto";

export const PROJECT_REF = "pcmdtscesnxmpuxcizfk";
export const ISSUER = `https://${PROJECT_REF}.supabase.co/auth/v1`;      // `iss` (jwt-fields: "https://project-ref.supabase.co/auth/v1")
export const SITE_ORIGIN = "https://my-flood-123.netlify.app";
const CLOCK_TOLERANCE_S = 30, MAX_TOKEN_AGE_S = 3600, MAX_TOKEN_LEN = 4096;

/** OWNER_EMAILS: comma-separated, trimmed, lower-cased, empties dropped. Empty/unset → empty set → deny all. */
export function parseOwnerEmails(raw) {
  if (typeof raw !== "string") return new Set();
  return new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter((s) => s.length > 0 && s.includes("@")));
}

/** Exactly one `Authorization: Bearer <compact JWS>`; never from cookies or query string. */
export function getBearer(headers) {
  const h = headers.get("authorization");
  if (!h || h.length > MAX_TOKEN_LEN + 7) return null;
  const m = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(h);
  return m ? m[1] : null;
}

/** POST/PUT/PATCH/DELETE must carry Origin equal to the site; GET/HEAD need no Origin. */
export function originOk(method, headers, siteOrigin = SITE_ORIGIN) {
  if (method === "GET" || method === "HEAD") return true;
  return headers.get("origin") === siteOrigin;
}

const b64uJson = (s) => JSON.parse(Buffer.from(s, "base64url").toString("utf8"));

/** Mirrors jwtVerify(token, JWKS, { algorithms:["ES256"], issuer, audience:"authenticated",
 *  clockTolerance:30, maxTokenAge:3600, requiredClaims:["exp","iat","sub","email","session_id"] }). */
export function verifyAccessToken(token, jwks, nowS) {
  const [h, p, s] = token.split(".");
  let header, claims;
  try { header = b64uJson(h); claims = b64uJson(p); } catch { return { ok: false, status: 401, code: "malformed" }; }
  if (header.alg !== "ES256") return { ok: false, status: 401, code: "alg" };              // blocks none/HS256 confusion
  const jwk = jwks.keys.find((k) => k.kid === header.kid && k.kty === "EC" && k.crv === "P-256" && (!k.alg || k.alg === "ES256"));
  if (!jwk) return { ok: false, status: 401, code: "kid" };
  const good = cVerify("sha256", Buffer.from(`${h}.${p}`), { key: createPublicKey({ key: jwk, format: "jwk" }), dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url"));
  if (!good) return { ok: false, status: 401, code: "signature" };
  for (const c of ["exp", "iat", "sub", "email", "session_id"]) if (claims[c] === undefined) return { ok: false, status: 401, code: `missing_${c}` };
  if (claims.iss !== ISSUER) return { ok: false, status: 401, code: "iss" };
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes("authenticated")) return { ok: false, status: 401, code: "aud" };
  if (typeof claims.exp !== "number" || claims.exp + CLOCK_TOLERANCE_S <= nowS) return { ok: false, status: 401, code: "exp" };
  if (typeof claims.iat !== "number" || nowS - claims.iat > MAX_TOKEN_AGE_S + CLOCK_TOLERANCE_S) return { ok: false, status: 401, code: "too_old" };
  if (claims.nbf !== undefined && claims.nbf - CLOCK_TOLERANCE_S > nowS) return { ok: false, status: 401, code: "nbf" };
  // Claims jose does not check for us:
  if (claims.role !== "authenticated") return { ok: false, status: 401, code: "role" };
  if (claims.is_anonymous === true) return { ok: false, status: 401, code: "anonymous" };
  if (typeof claims.email !== "string" || typeof claims.sub !== "string") return { ok: false, status: 401, code: "types" };
  return { ok: true, claims };
}

/** Authorisation after a valid token. `user` = JSON from GET /auth/v1/user (strict endpoints only). */
export function authorizeOwner(claims, owners, user = undefined) {
  if (owners.size === 0) return { ok: false, status: 403, code: "no_owners_configured" };
  const email = claims.email.trim().toLowerCase();
  if (!owners.has(email)) return { ok: false, status: 403, code: "not_owner" };
  const providers = claims.app_metadata?.providers;
  if (!Array.isArray(providers) || !providers.includes("google")) return { ok: false, status: 403, code: "not_google" };
  // NEVER read user_metadata.email_verified: Supabase says user_metadata "is editable by the user without any checks".
  if (user !== undefined) {
    if (!user || user.id !== claims.sub) return { ok: false, status: 401, code: "user_mismatch" };
    if (typeof user.email !== "string" || user.email.trim().toLowerCase() !== email) return { ok: false, status: 403, code: "email_changed" };
    if (!user.email_confirmed_at) return { ok: false, status: 403, code: "email_unconfirmed" };   // users page: null = not confirmed
  }
  return { ok: true, email, sub: claims.sub, sessionId: claims.session_id };
}

/** Whole gate, in order. No Blobs/Claude/GitHub side effects happen before this returns ok. */
export function gate({ method, headers }, { jwks, ownersRaw, nowS, user }) {
  if (!originOk(method, headers)) return { ok: false, status: 403, code: "origin" };
  const token = getBearer(headers);
  if (!token) return { ok: false, status: 401, code: "no_token" };
  const v = verifyAccessToken(token, jwks, nowS);
  if (!v.ok) return v;
  return authorizeOwner(v.claims, parseOwnerEmails(ownersRaw), user);
}

// ───────────────────────────── hostile tests ─────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const T = 1_800_000_000;
  const mkKey = () => generateKeyPairSync("ec", { namedCurve: "P-256" });
  const good = mkKey(), evil = mkKey();
  const jwk = { ...good.publicKey.export({ format: "jwk" }), kid: "k1", alg: "ES256", use: "sig", key_ops: ["verify"] };
  const JWKS = { keys: [jwk] };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const signES = (header, claims, key = good.privateKey) => {
    const data = `${enc(header)}.${enc(claims)}`;
    return `${data}.${cSign("sha256", Buffer.from(data), { key, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
  };
  const base = {
    iss: ISSUER, aud: "authenticated", exp: T + 3000, iat: T - 600, sub: "8b6a4c1e-0000-4000-8000-000000000001",
    role: "authenticated", aal: "aal1", session_id: "5f0c-session", email: "Owner@Example.com", phone: "",
    is_anonymous: false, app_metadata: { provider: "google", providers: ["google"] },
    user_metadata: { email_verified: true },
  };
  const H = { alg: "ES256", kid: "k1", typ: "JWT" };
  const OWNERS = " owner@example.com , ,second@example.com ";
  const req = (token, { method = "POST", origin = SITE_ORIGIN, auth } = {}) => ({
    method, headers: new Headers({ ...(origin ? { origin } : {}), ...(auth ?? (token ? { authorization: `Bearer ${token}` } : {})) }),
  });
  const run = (r, o = {}) => gate(r, { jwks: JWKS, ownersRaw: OWNERS, nowS: T, ...o });

  // parsing
  assert.deepEqual([...parseOwnerEmails(OWNERS)], ["owner@example.com", "second@example.com"]);
  for (const empty of [undefined, "", " , ", "not-an-email"]) assert.equal(parseOwnerEmails(empty).size, 0);

  // happy paths
  assert.deepEqual(run(req(signES(H, base))), { ok: true, email: "owner@example.com", sub: base.sub, sessionId: base.session_id });
  assert.equal(run(req(signES(H, base), { method: "GET", origin: null })).ok, true);
  assert.equal(run(req(signES(H, { ...base, aud: ["authenticated"] }))).ok, true);
  const confirmedUser = { id: base.sub, email: "owner@example.com", email_confirmed_at: "2026-11-26T00:00:00Z" };
  assert.equal(run(req(signES(H, base)), { user: confirmedUser }).ok, true);

  const hdr = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const hostile = [
    // [name, request, options, expected status, expected code]
    ["no header", req(null), {}, 401, "no_token"],
    ["Basic scheme", req(null, { auth: { authorization: "Basic b3duZXI6cHc=" } }), {}, 401, "no_token"],
    ["lower-case bearer", req(null, { auth: { authorization: `bearer ${signES(H, base)}` } }), {}, 401, "no_token"],
    ["two tokens", req(null, { auth: { authorization: `Bearer ${signES(H, base)} ${signES(H, base)}` } }), {}, 401, "no_token"],
    ["oversized", req("a".repeat(3000) + "." + "b".repeat(1200) + ".c"), {}, 401, "no_token"],
    ["alg none", req(`${hdr({ alg: "none", kid: "k1" })}.${enc(base)}.`), {}, 401, "no_token"],
    ["alg none + junk sig", req(`${hdr({ alg: "none", kid: "k1" })}.${enc(base)}.AAAA`), {}, 401, "alg"],
    ["HS256 confusion", req(`${hdr({ alg: "HS256", kid: "k1" })}.${enc(base)}.AAAA`), {}, 401, "alg"],
    ["RS256 header", req(`${hdr({ alg: "RS256", kid: "k1" })}.${enc(base)}.AAAA`), {}, 401, "alg"],
    ["unknown kid", req(signES({ ...H, kid: "attacker" }, base)), {}, 401, "kid"],
    ["signed by attacker key", req(signES(H, base, evil.privateKey)), {}, 401, "signature"],
    ["payload swapped after signing", req((() => { const [a, , c] = signES(H, { ...base, email: "x@example.net" }).split("."); return `${a}.${enc(base)}.${c}`; })()), {}, 401, "signature"],
    ["other Supabase project iss", req(signES(H, { ...base, iss: "https://attackerref0000000000.supabase.co/auth/v1" })), {}, 401, "iss"],
    ["legacy iss 'supabase'", req(signES(H, { ...base, iss: "supabase" })), {}, 401, "iss"],
    ["iss trailing slash", req(signES(H, { ...base, iss: ISSUER + "/" })), {}, 401, "iss"],
    ["aud anon", req(signES(H, { ...base, aud: "anon" })), {}, 401, "aud"],
    ["expired", req(signES(H, { ...base, exp: T - 31 })), {}, 401, "exp"],
    ["exp as string", req(signES(H, { ...base, exp: String(T + 999) })), {}, 401, "exp"],
    ["no exp", req(signES(H, (({ exp, ...r }) => r)(base))), {}, 401, "missing_exp"],
    ["no email", req(signES(H, (({ email, ...r }) => r)(base))), {}, 401, "missing_email"],
    ["iat too old (long-lived token)", req(signES(H, { ...base, iat: T - 3700, exp: T + 86400 })), {}, 401, "too_old"],
    ["nbf in future", req(signES(H, { ...base, nbf: T + 120 })), {}, 401, "nbf"],
    ["service_role", req(signES(H, { ...base, role: "service_role" })), {}, 401, "role"],
    ["anonymous user", req(signES(H, { ...base, is_anonymous: true })), {}, 401, "anonymous"],
    ["stranger's Google account", req(signES(H, { ...base, email: "stranger@example.net" })), {}, 403, "not_owner"],
    ["look-alike domain", req(signES(H, { ...base, email: "owner@example.com.evil.test" })), {}, 403, "not_owner"],
    ["Cyrillic look-alike", req(signES(H, { ...base, email: "оwner@example.com" })), {}, 403, "not_owner"],
    ["OWNER_EMAILS unset", req(signES(H, base)), { ownersRaw: undefined }, 403, "no_owners_configured"],
    ["OWNER_EMAILS blank", req(signES(H, base)), { ownersRaw: " , " }, 403, "no_owners_configured"],
    ["owner email via email/password identity", req(signES(H, { ...base, app_metadata: { provider: "email", providers: ["email"] } })), {}, 403, "not_google"],
    ["providers only in user_metadata", req(signES(H, { ...base, app_metadata: {}, user_metadata: { providers: ["google"] } })), {}, 403, "not_google"],
    ["strict: unconfirmed email", req(signES(H, base)), { user: { ...confirmedUser, email_confirmed_at: null } }, 403, "email_unconfirmed"],
    ["strict: email changed server-side", req(signES(H, base)), { user: { ...confirmedUser, email: "new@example.org" } }, 403, "email_changed"],
    ["strict: /user is a different user", req(signES(H, base)), { user: { ...confirmedUser, id: "other" } }, 401, "user_mismatch"],
    ["CSRF: cross-site Origin", req(signES(H, base), { origin: "https://evil.example" }), {}, 403, "origin"],
    ["CSRF: missing Origin on POST", req(signES(H, base), { origin: null }), {}, 403, "origin"],
    ["CSRF: Origin 'null'", req(signES(H, base), { origin: "null" }), {}, 403, "origin"],
    ["CSRF: http downgrade", req(signES(H, base), { origin: "http://my-flood-123.netlify.app" }), {}, 403, "origin"],
    ["CSRF: deploy-preview subdomain", req(signES(H, base), { origin: "https://deploy-preview-1--my-flood-123.netlify.app" }), {}, 403, "origin"],
  ];
  for (const [name, r, o, status, code] of hostile) {
    const res = run(r, o);
    assert.equal(res.ok, false, `${name}: must be denied`);
    assert.deepEqual([res.status, res.code], [status, code], `${name}: got ${res.status}/${res.code}`);
  }
  console.log(`04-supabase-owner-check: 5 allowed and ${hostile.length} hostile cases behave correctly`);
}
