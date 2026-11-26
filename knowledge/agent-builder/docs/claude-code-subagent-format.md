# Claude Code subagent files — format reference

Source: Claude Code docs, *Create custom subagents* — <https://code.claude.com/docs/en/sub-agents> (read 2026-11-26)

## Location and identity
- Project subagents: `.claude/agents/` — "ideal for subagents specific to a codebase. Check them
  into version control". Scanned recursively; "identity comes only from the `name` frontmatter field".
- Claude Code watches `.claude/agents/`; edits apply "within a few seconds … with no restart needed".

## Frontmatter (only `name` and `description` are required)
"Multi-word field names use camelCase … Claude Code ignores a field it doesn't recognize without
reporting an error."
| Field | Notes (quoted/abridged) |
|---|---|
| `name` | ≤ 256 chars; "Names can't contain `:`"; can't start with `-` |
| `description` | "When Claude should delegate to this subagent" |
| `tools` | comma string or YAML list; "Inherits every tool … if omitted"; zero resolvable entries → fails to launch |
| `disallowedTools` | removed from the pool; applied before `tools` |
| `model` | `sonnet`, `opus`, `haiku`, `fable`, full ID, or `inherit` |
| `permissionMode`, `maxTurns`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`, `initialPrompt`, `omitClaudeMd`, `autoCompactWindow` | optional |
| `skills` | "Skills to preload into the subagent's context at startup. The full skill content is injected" — first 32 names |

## Files that are skipped
No `name` (treated as documentation); opening `---` not on line 1; bad `name`; `name` without
`description`; YAML that doesn't parse. Check with `claude plugin validate .claude/agents`.

## System prompt
"The body becomes the system prompt … Subagents receive this system prompt plus basic environment
details like the working directory, not the Claude Code system prompt."

## Preloading skills
"You can't preload skills that set `disable-model-invocation: true`." "If a listed skill is missing
or disabled … Claude Code skips it and logs a warning to the debug log." Without `skills`, a
subagent can still invoke skills through the Skill tool.
