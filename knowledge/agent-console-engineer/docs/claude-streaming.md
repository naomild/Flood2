# Claude API — streaming

Source: Claude API docs, *Streaming Messages* — <https://platform.claude.com/docs/en/build-with-claude/streaming.md> (read 2026-11-26)

Set `"stream": true` to receive server-sent events (SSE). Event flow:
1. `message_start` — a `Message` with empty `content`.
2. Per content block: `content_block_start`, any number of `content_block_delta`,
   `content_block_stop`. Each block has an `index` matching its position in the final
   `content` array. Some blocks arrive whole with no deltas (e.g. `redacted_thinking`,
   server tool results, `fallback` blocks after a server-side fallback).
3. One or more `message_delta` events — top-level changes (e.g. `stop_reason`, `usage`).
4. `message_stop`.

TypeScript SDK (from the page):
```ts
const client = new Anthropic();
await client.messages
  .stream({ messages: [{ role: "user", content: "Hello" }], model: "claude-opus-5-5", max_tokens: 1024 })
  .on("text", (text) => { console.log(text); });
```

Errors mid-stream: "If you use the SDK, your code doesn't receive this event. The SDK ends the
stream, and the code that reads the stream gets an error instead."

## Flood pattern (Netlify streaming function, 60 s limit)
- Forward only text deltas to the browser as our own SSE events (`data: {"type":"text",...}`),
  plus `done` (with `stop_reason`, `usage`) and `error` events. Never forward raw API events
  that could carry internal details.
- `await stream.finalMessage()` gives the full `Message` for the tool loop and usage.
- Stop starting new model calls after ~45 s so the function can save state and finish.
See `examples/02-chat-sse-tool-loop.mjs`.
