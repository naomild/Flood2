# Claude API — tool use

Sources (read 2026-11-26):
- Claude API docs, *Tool use overview* — <https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview.md>
  (page fetched; its details didn't extract, so the rules below come from the next source)
- Anthropic's official Claude API reference bundled with Claude Code (`claude-api` skill,
  `shared/tool-use-concepts.md`, `typescript/claude-api/tool-use.md`), version 2.1.332.

## Definition
```json
{ "name": "get_weather",
  "description": "Get current weather for a location",
  "input_schema": { "type": "object",
    "properties": { "location": { "type": "string", "description": "City and state" } },
    "required": ["location"] } }
```
Best practices (quoted): "Use clear, descriptive names"; "Write detailed descriptions … Be
**prescriptive about *when* to call it**"; "Include descriptions for each property"; "Use
`enum` for parameters with a fixed set of values". `strict: true` (+ `additionalProperties:
false`) guarantees schema-valid inputs.

## tool_choice
| Value | Behaviour |
|---|---|
| `{"type":"auto"}` | Claude decides (default) |
| `{"type":"any"}` | must use a tool |
| `{"type":"tool","name":…}` | must use that tool |
| `{"type":"none"}` | no tools |

"Claude Fable 5.2, … Claude Opus 5.5, and Claude Sonnet 5.5 reject forced tool use":
`any`/`tool` return 400. Use `auto` + prompt instructions (+ `strict: true`), and check that a
call was actually made. `disable_parallel_tool_use: true` limits to one call per response.

## The loop
1. Response has `stop_reason: "tool_use"` and one or more `tool_use` blocks (`id`, `name`, `input`).
2. Append the **whole** `response.content` as the assistant turn.
3. Run each tool; reply in **one** user message with a `tool_result` per call:
   `{"type":"tool_result","tool_use_id":"…","content":"…"}`; on failure add `"is_error": true`
   with an informative message.
4. Repeat until `end_turn` (or stop on `max_tokens` / `refusal`).

"Claude can request multiple tools in a single response. Handle them all before continuing —
send all results back in a single `user` message."

Security note from the same reference: "the model-supplied `path` is untrusted output, so
confine it to a project root before writing". Flood: path allow-list + human Approve.
