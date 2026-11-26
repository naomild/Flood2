# Knowledge — `agent-console-engineer`

Claude Messages API, models, streaming, tool use; GitHub contents and commits.

Read **every file here** before answering, and prefer it over memory. Each note quotes or
summarises an official source and links to it; examples show what good looks like.

## docs/ (reference notes)

| File | Topic | Sources |
|---|---|---|
| [claude-messages-api.md](docs/claude-messages-api.md) | Claude Messages API — request, response, stop reasons, errors | platform.claude.com |
| [claude-models.md](docs/claude-models.md) | Claude models (current) | platform.claude.com |
| [claude-streaming.md](docs/claude-streaming.md) | Claude API — streaming | platform.claude.com |
| [claude-tool-use.md](docs/claude-tool-use.md) | Claude API — tool use | platform.claude.com |
| [github-contents-and-commits.md](docs/github-contents-and-commits.md) | GitHub REST API — repository contents and commits | docs.github.com |

## examples/ (worked examples)

- [`01-list-agents.mjs`](examples/01-list-agents.mjs) — Example 1 — /api/agents core: read .claude/agents/*.md, return name, model, persona.
- [`02-chat-sse-tool-loop.mjs`](examples/02-chat-sse-tool-loop.mjs) — Example 2 — /api/chat core: stream a Claude turn as SSE, run a tool loop, propose-only tools.
- [`03-approve-commit.mjs`](examples/03-approve-commit.mjs) — Example 3 — Approve → commit to main through the GitHub contents API (fetch mocked).

**Run (from `examples/`):** `node 01-list-agents.mjs` · `node 02-chat-sse-tool-loop.mjs` (needs `@anthropic-ai/sdk`) · `node 03-approve-commit.mjs`

All code examples were run and passed on 2026-11-26. Re-run everything with
`cd knowledge && npm install && npm run verify`.
