// Example 2 — a Netlify Function in the documented modern format, run locally as a plain
// (Request) => Response. Run: node 02-function-with-rate-limit.mjs
// Docs: Functions API (signature, Config.rateLimit, Context.ip), env vars in functions (process.env),
// Custom headers (don't apply to function responses → set them here).
import assert from "node:assert/strict";

const REQUIRED_ENV = ["ANTHROPIC_API_KEY", "CONSOLE_PASSWORD_HASH", "SESSION_SECRET"];
const json = (status, body) => new Response(JSON.stringify(body), { status,
  headers: { "content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff" } });

export default async function handler(req, context) {
  if (req.method !== "POST") return json(405, { error: "Use POST" });
  const missing = REQUIRED_ENV.filter((n) => !process.env[n]);
  if (missing.length) return json(500, { error: "Server is not configured", missing }); // names only, never values
  if (!(req.headers.get("content-type") ?? "").startsWith("application/json")) return json(415, { error: "Send JSON" });
  const text = await req.text();
  if (text.length > 20_000) return json(413, { error: "Message too long" });
  let body; try { body = JSON.parse(text); } catch { return json(400, { error: "Invalid JSON" }); }
  if (typeof body.message !== "string" || !body.message.trim()) return json(400, { error: "message is required" });
  return json(200, { ok: true, requestId: context.requestId, chars: body.message.length });
}

// Free plan: this is one of our 2 code-based rate-limit rules (the other is /api/login).
export const config = {
  path: "/api/chat",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const ctx = { requestId: "01FDWR77JMF2DA1CHF5YA6H07C", ip: "203.0.113.7" };
  const post = (body, type = "application/json") => new Request("https://flood.example/api/chat",
    { method: "POST", headers: { "content-type": type }, body });

  let r = await handler(new Request("https://flood.example/api/chat"), ctx);
  assert.equal(r.status, 405);

  for (const n of REQUIRED_ENV) delete process.env[n];
  r = await handler(post('{"message":"hi"}'), ctx);
  assert.equal(r.status, 500);
  assert.deepEqual((await r.json()).missing, REQUIRED_ENV);

  Object.assign(process.env, { ANTHROPIC_API_KEY: "sk-ant-test", CONSOLE_PASSWORD_HASH: "scrypt$…", SESSION_SECRET: "x".repeat(32) });
  r = await handler(post('{"message":"hi"}', "text/plain"), ctx);
  assert.equal(r.status, 415);
  r = await handler(post("{nope"), ctx);
  assert.equal(r.status, 400);
  r = await handler(post(JSON.stringify({ message: "x".repeat(25_000) })), ctx);
  assert.equal(r.status, 413);
  r = await handler(post('{"message":"Is Miami flooding?"}'), ctx);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "no-store");
  const out = await r.json();
  assert.equal(out.requestId, ctx.requestId);
  assert.ok(!JSON.stringify(out).includes("sk-ant"), "never echo secrets");
  assert.equal(config.rateLimit.windowSize <= 180, true);
  console.log("02-function-with-rate-limit: all checks passed");
}
