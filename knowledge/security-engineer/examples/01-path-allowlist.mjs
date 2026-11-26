// Example 1 — write allow-list for agent proposals, with hostile table-driven tests.
// Run: node 01-path-allowlist.mjs
// Basis: OWASP LLM Prompt Injection cheat sheet (output validation, least privilege) and
// docs/04-agent-console.md §5. Re-run this check at proposal time AND at Approve time.
import assert from "node:assert/strict";
import { posix } from "node:path";

const ALLOW = [/^public\//, /^src\//, /^tests\//, /^docs\//];
const DENY = [/^public\/_headers$/, /^public\/_redirects$/, /^netlify\//, /^netlify\.toml$/, /^package(-lock)?\.json$/,
  /^\.github\//, /^\.claude\//, /(^|\/)\.env/, /(^|\/)_headers$/, /(^|\/)_redirects$/];
const SAFE_CHARS = /^[A-Za-z0-9._\-/]+$/;       // ASCII only: no %, \, spaces, control or look-alike chars

/** @returns {{ok:true, path:string} | {ok:false, reason:string}} */
export function checkWritablePath(input) {
  if (typeof input !== "string" || input.length === 0 || input.length > 200) return { ok: false, reason: "empty or too long" };
  if (!SAFE_CHARS.test(input)) return { ok: false, reason: "disallowed characters" };
  if (input.startsWith("/")) return { ok: false, reason: "absolute path" };
  const norm = posix.normalize(input);
  if (norm !== input || norm.split("/").some((seg) => seg === ".." || seg === "." || seg === "")) return { ok: false, reason: "not a normalised relative path" };
  if (DENY.some((r) => r.test(norm))) return { ok: false, reason: "path is protected" };
  if (!ALLOW.some((r) => r.test(norm))) return { ok: false, reason: "path is not on the allow-list" };
  return { ok: true, path: norm };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const allowed = ["src/scoring/thresholds.js", "public/index.html", "public/styles/tokens.css", "docs/01-use-case-and-scoring.md", "tests/scoring.test.js"];
  const hostile = [
    "netlify.toml", "netlify/functions/approve.mts", "netlify/lib/auth.ts", "package.json", "package-lock.json",
    ".github/workflows/deploy.yml", ".claude/agents/orchestrator.md", ".env", "src/.env.local",
    "public/_headers", "public/_redirects", "_headers",
    "../netlify.toml", "public/../netlify.toml", "src/./x.js", "src//x.js", "/etc/passwd", "src/",
    "public\\..\\netlify.toml", "%2e%2e/netlify.toml", "src/%2e%2e/netlify.toml",
    "src/scoring/thresholds.js\u0000.png", "src/​x.js", "ѕrc/x.js" /* Cyrillic ѕ */, "src/ x.js",
    "README.md", "", "a".repeat(201), null, 42,
  ];
  for (const p of allowed) assert.equal(checkWritablePath(p).ok, true, `should allow ${p}`);
  for (const p of hostile) {
    const r = checkWritablePath(p);
    assert.equal(r.ok, false, `should block ${JSON.stringify(p)}`);
  }
  console.log(`01-path-allowlist: ${allowed.length} allowed and ${hostile.length} hostile cases behave correctly`);
}
