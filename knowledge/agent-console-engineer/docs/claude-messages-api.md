# Claude Messages API — request, response, stop reasons, errors

Source: Claude API docs, *Create a Message* — <https://platform.claude.com/docs/en/api/messages/create.md> (read 2026-11-26)

## Request
- `POST /v1/messages`
- Headers: `x-api-key`, `anthropic-version`, `content-type`. The SDK sets these; in Flood use
  `@anthropic-ai/sdk` inside Netlify Functions only.
- Required body: `model`, `max_tokens`, `messages`. Optional `system` ("string or array of
  TextBlockParam").
- Messages: "Our models are trained to operate on alternating `user` and `assistant`
  conversational turns." "Consecutive `user` or `assistant` turns in your request will be
  combined into a single turn." Content is a string or an array of typed blocks.
- **Prefill:** "On models that don't support prefill, creating a message that ends with a
  partial `assistant` response returns a 400 error." → never end `messages` with an
  assistant turn.

## Response
`id`, `type: "message"`, `role: "assistant"`, `content` (array of blocks), `model`,
`stop_reason`, `stop_sequence`, `usage`.

| `stop_reason` | Meaning (quoted) | Flood action |
|---|---|---|
| `end_turn` | "the model reached a natural stopping point" | done |
| `max_tokens` | "we exceeded the requested `max_tokens` or the model's maximum" | mark partial; don't run a half-written tool call |
| `stop_sequence` | "one of your provided custom `stop_sequences` was generated" | not used |
| `tool_use` | "the model invoked one or more tools" | run tools, send results |
| `pause_turn` | "we paused a long-running turn. You may provide the response back as-is…" | resend as-is |
| `refusal` | "when streaming classifiers intervene to handle potential policy violations" | show a polite message; don't retry blindly |
| `model_context_window_exceeded` | "we exceeded the model's context window" | start a new conversation / summarise |

`usage`: `input_tokens`, `output_tokens`, `cache_creation_input_tokens`,
`cache_read_input_tokens` → add to the daily budget counter in Blobs.

## Errors
Error codes appear as `error.details.error_code` in the body. Examples listed on the page:
429 `enforced_spend_limit_reached`, `contract_spend_limit_reached`; 413
`request_body_too_large_after_decoding`; 529 `compaction_unavailable`. Treat 429/5xx/529 as
retryable (the SDK retries twice by default) and 400/401/403/404/413 as not retryable.
