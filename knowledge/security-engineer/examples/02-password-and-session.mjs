// Example 2 — console password hash (scrypt, OWASP parameters) and signed session cookie.
// Run: node 02-password-and-session.mjs   (Node built-ins only)
// OWASP Password Storage: scrypt "N=2^15 (32 MiB), r=8 (1024 bytes), p=3" is a listed minimum.
// OWASP Session Management: Secure, HttpOnly, SameSite=Strict, narrow Path, ≥64-bit random IDs,
// idle + absolute timeouts, new ID at login.
import assert from "node:assert/strict";
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "node:crypto";

const N = 2 ** 15, r = 8, p = 3, KEYLEN = 32, MAXMEM = 64 * 1024 * 1024;

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, KEYLEN, { N, r, p, maxmem: MAXMEM });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  const [alg, n, rr, pp, saltB64, hashB64] = String(stored).split("$");
  if (alg !== "scrypt") return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = scryptSync(String(password).normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length,
    { N: Number(n), r: Number(rr), p: Number(pp), maxmem: MAXMEM });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const IDLE_S = 2 * 3600, ABSOLUTE_S = 12 * 3600;
const b64u = (b) => Buffer.from(b).toString("base64url");
const sign = (data, secret) => createHmac("sha256", secret).update(data).digest("base64url");

/** New session at every login: 128-bit random sid (OWASP minimum is 64 bits). */
export function issueSession(secret, nowS = Math.floor(Date.now() / 1000), iat = nowS) {
  const payload = b64u(JSON.stringify({ sid: randomBytes(16).toString("hex"), iat, last: nowS }));
  const value = `${payload}.${sign(payload, secret)}`;
  const cookie = `session=${value}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${IDLE_S}`;
  return { value, cookie };
}

/** @returns {{ok:true, session:object} | {ok:false, reason:string}} */
export function verifySession(value, secret, nowS = Math.floor(Date.now() / 1000)) {
  const [payload, mac] = String(value).split(".");
  if (!payload || !mac) return { ok: false, reason: "malformed" };
  const good = Buffer.from(sign(payload, secret)), got = Buffer.from(mac);
  if (good.length !== got.length || !timingSafeEqual(good, got)) return { ok: false, reason: "bad signature" };
  const s = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (nowS - s.iat > ABSOLUTE_S) return { ok: false, reason: "absolute timeout" };
  if (nowS - s.last > IDLE_S) return { ok: false, reason: "idle timeout" };
  return { ok: true, session: s };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const stored = hashPassword("correct horse battery staple");
  assert.match(stored, /^scrypt\$32768\$8\$3\$/);
  assert.equal(verifyPassword("correct horse battery staple", stored), true);
  assert.equal(verifyPassword("correct horse battery stapl", stored), false);
  assert.notEqual(hashPassword("same"), hashPassword("same"));        // unique salt each time

  const secret = randomBytes(32);
  const t0 = 1_800_000_000;
  const { value, cookie } = issueSession(secret, t0);
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict; Path=\/api/);
  assert.equal(verifySession(value, secret, t0 + 60).ok, true);
  assert.equal(verifySession(value, secret, t0 + IDLE_S + 1).reason, "idle timeout");
  const refreshed = issueSession(secret, t0 + 11 * 3600, t0).value;    // re-issued on use, same iat
  assert.equal(verifySession(refreshed, secret, t0 + 11.5 * 3600).ok, true);
  assert.equal(verifySession(refreshed, secret, t0 + 12 * 3600 + 1).reason, "absolute timeout");
  const [pl] = value.split(".");
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(pl, "base64url")), iat: t0 + 999999 })).toString("base64url");
  assert.equal(verifySession(`${forged}.${value.split(".")[1]}`, secret, t0).reason, "bad signature");
  assert.equal(verifySession(value, randomBytes(32), t0).reason, "bad signature");  // rotated secret logs everyone out
  assert.notEqual(issueSession(secret, t0).value, value);                         // new sid at every login
  console.log("02-password-and-session: all checks passed");
}
