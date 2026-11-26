---
name: agent-authoring
description: "How to write and improve Claude Code subagents and skills for this repo (.claude/agents, .claude/skills). Use when creating, reviewing or changing an agent or skill definition."
user-invocable: false
---
# Agent and skill authoring

Docs: https://code.claude.com/docs/en/sub-agents · https://code.claude.com/docs/en/skills

## Subagents — `.claude/agents/<name>.md`
- Front matter must start on line 1. Required: `name` (no `:`, not starting with `-`),
  `description` (when to delegate). Field names are exact; unknown ones are silently ignored.
- Used here: `tools`, `model` (`opus`/`sonnet`/`haiku`/`inherit`/full ID), `skills`
  (preloads full skill content at start; first 32 names), `color`.
- Least privilege: list only needed tools. Specialists omit `Agent` so they cannot spawn
  others — hand-offs go through the orchestrator.
- Body = system prompt: role, persona, owned files, rules, report format. The body
  replaces the Claude Code system prompt, so state everything the agent needs.

## Skills — `.claude/skills/<skill-name>/SKILL.md`
- `description` first sentence = key use case (description + `when_to_use` ≤ 1,536 chars).
- Reference skills here use `user-invocable: false`. A skill with
  `disable-model-invocation: true` cannot be preloaded into a subagent.
- Keep each under 500 lines, and short: preloaded skills cost context in every agent.
  Link to `docs/` for detail. Don't name a skill after a bundled one (e.g. `claude-api`).

## Keep the roster in sync
`docs/expert-roster.md` is the source of truth. Any added/removed agent or skill, or a
changed agent→skill mapping, updates the roster tables and `CLAUDE.md` in the same change.
Check: every `skills:` entry has a matching `.claude/skills/<name>/SKILL.md`.
