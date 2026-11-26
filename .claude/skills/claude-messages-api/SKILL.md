---
name: claude-messages-api
description: "How Flood's Netlify Functions call the Claude API (Messages API, models, streaming, tool use, refusals, cost). Use when writing or reviewing Agent Console code that talks to Claude."
user-invocable: false
---
# Claude Messages API (from Netlify Functions)

Detail: `docs/04-agent-console.md` §2. Verify against the live docs before relying on a
model ID or beta flag.

- SDK `@anthropic-ai/sdk`; `new Anthropic()` reads `ANTHROPIC_API_KEY`. Only in functions.
- Models: `claude-opus-5-5` (default; aliases `opus`/`inherit`), `claude-sonnet-5-5`
  (`sonnet`), `claude-haiku-5-5` (`haiku`). Allow-list these IDs; reject others.
- Chat: `client.messages.stream({...})`, forward text deltas as SSE; use
  `finalMessage()` when needed. `max_tokens` ≈ 16k non-streaming, up to 64k streaming.
- Opus 5.5 thinking is always adaptive — never send `thinking: {type:"disabled"}` or
  `budget_tokens` (400). Control cost with `output_config: { effort }`; its default is
  `medium`; use `low` for chat, `high` for code proposals.
- No assistant prefill (400). Forced `tool_choice` `any`/`tool` → 400 on Opus/Sonnet 5.5:
  use `auto` + `strict: true` tools + prompt instructions.
- Tool loop: append `response.content` unchanged; return all `tool_result`s for a turn in
  one user message; `is_error: true` on failures; parse inputs as JSON and validate them.
  With streaming client tools set `eager_input_streaming: true` and validate inputs.
- Check `stop_reason` first: `refusal`, `max_tokens`, `tool_use`, `end_turn`. For
  Opus/Sonnet 5.5 enable server-side fallback (`betas: ["server-side-fallback-2026-07-01"]`,
  `fallbacks: "default"` on `client.beta.messages.*`).
- Prompt caching: stable system prompt + tools first with `cache_control`; no timestamps
  in the system prompt.
- Count `usage` tokens into the daily budget counter (Blobs) on every call.
- Typed SDK errors: handle 429/5xx (retryable) separately from 400/401/404.
