// Example 1 — /api/agents core: read .claude/agents/*.md, return name, model, persona.
// Run: node 01-list-agents.mjs   (reads this repo's real agent files; no dependencies)
// Format: Claude Code sub-agents docs (https://code.claude.com/docs/en/sub-agents) — YAML front
// matter (name, description, tools, model, skills, color) then the system-prompt body.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

export const MODEL_IDS = Object.freeze({        // Claude API models overview, 2026-11-26
  opus: "claude-opus-5-5", inherit: "claude-opus-5-5", sonnet: "claude-sonnet-5-5", haiku: "claude-haiku-5-5",
});
const ALLOWED = new Set(Object.values(MODEL_IDS));

/** Minimal front-matter reader for our own files: `key: value`, JSON-quoted strings, `- item` lists. */
export function parseAgent(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: front matter must start on line 1`);
  const meta = {}; let listKey = null;
  for (const line of m[1].split("\n")) {
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && listKey) { meta[listKey].push(item[1].trim()); continue; }
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, k, v] = kv;
    if (v === "") { meta[k] = []; listKey = k; continue; }
    listKey = null;
    meta[k] = v.startsWith('"') ? JSON.parse(v) : v;
  }
  if (!meta.name || !meta.description) throw new Error(`${file}: name and description are required`);
  const body = m[2];
  const persona = body.match(/## Persona\n+([\s\S]*?)(?:\n## |\n*$)/)?.[1].trim()
    ?? body.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p.startsWith("You are"))  // skip "Before you answer"
    ?? "";
  const model = MODEL_IDS[meta.model ?? "inherit"] ?? meta.model;
  if (!ALLOWED.has(model)) throw new Error(`${file}: model ${meta.model} is not on the console allow-list`);
  return { id: meta.name, name: meta.name, description: meta.description, model,
    skills: meta.skills ?? [], personality: persona.replace(/\s+/g, " ") };
}

export async function listAgents(dir) {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  return Promise.all(files.map(async (f) => parseAgent(await readFile(new URL(f, dir), "utf8"), f)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const agents = await listAgents(new URL("../../../.claude/agents/", import.meta.url));
  for (const a of agents) console.log(`${a.name.padEnd(32)} ${a.model.padEnd(18)} ${a.personality.slice(0, 70)}…`);
  assert.equal(agents.length, 12);
  const sable = agents.find((a) => a.name === "ui-designer-apple-liquid-glass");
  assert.match(sable.personality, /^Calm, exacting/);          // from the ## Persona section
  assert.equal(agents.find((a) => a.name === "orchestrator").model, "claude-opus-5-5");
  assert.ok(agents.every((a) => a.personality && !/^\d\.|Read \*\*every file/.test(a.personality)), "persona, not instructions");
  assert.throws(() => parseAgent("---\nname: x\ndescription: y\nmodel: fable\n---\nhi", "x.md"), /allow-list/);
  assert.throws(() => parseAgent("\n---\nname: x\n---\n", "y.md"), /line 1/);
  console.log("01-list-agents: all checks passed");
}
