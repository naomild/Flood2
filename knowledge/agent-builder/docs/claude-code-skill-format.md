# Claude Code skills — format reference

Source: Claude Code docs, *Extend Claude with skills* — <https://code.claude.com/docs/en/skills> (read 2026-11-26)

- Project skills: `.claude/skills/<skill-name>/SKILL.md` — "Sessions in this repository … Commit it
  so your team gets it too".
- "Every skill needs a `SKILL.md` file with two parts: YAML frontmatter … that tells Claude when to
  use the skill, and markdown content with the instructions".
- "All fields are optional. Only `description` is recommended". Field names "use lowercase words
  separated by hyphens, except `when_to_use`". Unknown fields are silently ignored. Frontmatter is
  read "only when the opening `---` is the file's first line".

| Field | Notes |
|---|---|
| `name` | command name; defaults to the directory name; no `<`, `>`, control or zero-width chars |
| `description` | "Put the key use case first: the combined `description` and `when_to_use` text is truncated at 1,536 characters" |
| `disable-model-invocation` | `true` → only the user can run it; **also prevents preloading into subagents** |
| `user-invocable` | `false` → hidden from the `/` menu; "Use for background knowledge" |
| `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context: fork`, `agent`, `paths`, `hooks`, `arguments`, `argument-hint` | optional |

- Content types: **reference content** ("Conventions, patterns, style guides, domain knowledge")
  vs **task content** (step-by-step actions, often `disable-model-invocation: true`).
- "Keep the body itself concise. Once a skill loads, its content stays in context across turns, so
  every line is a recurring token cost." "Keep `SKILL.md` under 500 lines."
- Supporting files (reference.md, examples, scripts) live next to `SKILL.md`; link to them.
- Reserved names: `synced`, `anthropic-skills`. Avoid clashing with bundled skills
  (Flood uses `claude-messages-api`, not `claude-api`).
