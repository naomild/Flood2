# Knowledge — `agent-builder`

Writing and improving Claude Code subagents and skills (and these knowledge folders).

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [claude-code-skill-format.md](docs/claude-code-skill-format.md) | Claude Code skills — format reference | code.claude.com |
| [claude-code-subagent-format.md](docs/claude-code-subagent-format.md) | Claude Code subagent files — format reference | code.claude.com |

## examples/ (worked examples)

- [`03-improve-an-agent-from-evidence.md`](examples/03-improve-an-agent-from-evidence.md) — Example 3 — Improve an agent from evidence (smallest effective change)
- `sample/` — a valid sample agent and skill (validated with `claude plugin validate`)

**Run (from `examples/`):** `claude plugin validate sample/agents` · `claude plugin validate sample/skills`

All code examples were run and passed on 2026-11-26. Re-run everything with
`cd knowledge && npm install && npm run verify`.
