# Claude Code subagents — what the orchestrator relies on

Source: Claude Code docs, *Create custom subagents* — <https://code.claude.com/docs/en/sub-agents> (read 2026-11-26)

## Running the team
- **As the main session:** "When an agent runs as the main thread with `claude --agent`, it can
  spawn subagents using the Agent tool. To restrict which subagent types it can spawn, use
  `Agent(agent_type)` syntax in the `tools` field." This is an allow-list. Flood's
  `orchestrator.md` lists the 11 specialists.
- **As a subagent:** "In a subagent definition, listing `Agent` in `tools` lets that subagent
  spawn subagents of its own while the depth limit allows it, but any type list inside the
  parentheses is ignored."
- "If you omit `Agent` from the `tools` list entirely, the agent can't spawn any subagents" —
  that is why specialists can't call each other: hand-offs go through you.

## Parallel work
- "For independent investigations, spawn multiple subagents to work simultaneously … Each
  subagent explores its area independently, then Claude synthesizes the findings."
- "Running many subagents that each return detailed results can consume significant context,
  and each subagent spends tokens of its own while it runs." → ask for the short report format.
- **Concurrent limit:** "By default, when 20 subagents are running in a session, spawning another
  … fails with `Concurrent subagent limit reached`" (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`).
- **Depth:** subagents can nest "up to three layers below the main conversation"
  (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`).

## Chaining
"For multi-step workflows, ask Claude to use subagents in sequence. Each subagent completes its
task and returns results to Claude, which then passes relevant context to the next subagent."

## Foreground vs background
"Foreground subagents block the main conversation until complete." "Background subagents run
concurrently while you continue working." With nothing configured, spawned custom subagents
start in the background; you are notified when each finishes.

## Context a subagent starts with
A subagent gets its own system prompt (the agent file body) "plus basic environment details like
the working directory, not the Claude Code system prompt", plus CLAUDE.md and its preloaded
`skills`. It does **not** see this conversation → every brief must be self-contained.

## When not to delegate
Use the main conversation when "the task needs frequent back-and-forth", "multiple phases share
significant context", "you're making a quick, targeted change", or "latency matters".
