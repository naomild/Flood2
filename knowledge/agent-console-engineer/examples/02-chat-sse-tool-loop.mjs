// Example 2 — /api/chat core: stream a Claude turn as SSE, run a tool loop, propose-only tools.
// Uses the real @anthropic-ai/sdk; the API is mocked by passing a custom `fetch` (SDK option), so
// no key or network is needed.  Run (needs the SDK installed):  npm i @anthropic-ai/sdk && node 02-chat-sse-tool-loop.mjs
// Docs: Messages API, Streaming (event flow), Tool use (tool_result in one user message, is_error).
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";

export const TOOLS = [
  { name: "read_file", strict: true,
    description: "Read a text file from the Flood repo. Call this before proposing a change to that file.",
    input_schema: { type: "object", additionalProperties: false, required: ["path"],
      properties: { path: { type: "string", description: "Repo-relative path, e.g. src/scoring/thresholds.js" } } } },
  { name: "propose_change", strict: true,
    description: "Propose new content for one file. Nothing is committed: the owner must click Approve.",
    input_schema: { type: "object", additionalProperties: false, required: ["path", "new_content", "summary"],
      properties: { path: { type: "string" }, new_content: { type: "string" }, summary: { type: "string" } } } },
];

const READABLE = [/^src\//, /^public\//, /^docs\//, /^tests\//];
const validPath = (p) => typeof p === "string" && !p.includes("..") && !p.startsWith("/") && READABLE.some((r) => r.test(p));

/**
 * Runs one chat turn (with tool calls) and writes our own SSE events via `send`.
 * @param {{client: Anthropic, model: string, system: string, messages: any[], send: (e: object) => void,
 *          tools: {readFile: (p:string)=>Promise<string>, propose: (i:any)=>Promise<string>}, deadline: number}} o
 */
export async function runTurn({ client, model, system, messages, send, tools, deadline, maxSteps = 6 }) {
  const usage = { input_tokens: 0, output_tokens: 0 };
  for (let step = 0; step < maxSteps; step++) {
    if (Date.now() > deadline) { send({ type: "paused", reason: "time" }); return { stop: "paused", usage }; }
    const stream = client.messages.stream({
      model, max_tokens: 16000, system, messages, tools: TOOLS, tool_choice: { type: "auto" },
      output_config: { effort: "low" },
    });
    stream.on("text", (text) => send({ type: "text", text }));
    const msg = await stream.finalMessage();
    usage.input_tokens += msg.usage.input_tokens; usage.output_tokens += msg.usage.output_tokens;
    messages.push({ role: "assistant", content: msg.content });          // append the WHOLE content

    if (msg.stop_reason === "refusal") { send({ type: "error", message: "Claude declined this request." }); return { stop: "refusal", usage }; }
    if (msg.stop_reason === "max_tokens") { send({ type: "error", message: "Reply was cut off." }); return { stop: "max_tokens", usage }; }
    if (msg.stop_reason !== "tool_use") { send({ type: "done", stop_reason: msg.stop_reason, usage }); return { stop: msg.stop_reason, usage }; }

    const results = [];
    for (const block of msg.content.filter((b) => b.type === "tool_use")) {
      try {
        if (!validPath(block.input?.path)) throw new Error(`Path not allowed: ${block.input?.path}`);
        const out = block.name === "read_file" ? await tools.readFile(block.input.path)
          : block.name === "propose_change" ? await tools.propose(block.input)
          : (() => { throw new Error(`Unknown tool ${block.name}`); })();
        results.push({ type: "tool_result", tool_use_id: block.id, content: out });
      } catch (e) {
        results.push({ type: "tool_result", tool_use_id: block.id, content: e.message, is_error: true });
      }
    }
    messages.push({ role: "user", content: results });                   // ALL results in ONE user message
  }
  send({ type: "paused", reason: "steps" });
  return { stop: "paused", usage };
}

// ---- mocked API (SSE per the Streaming docs' event flow) -----------------------------------
const sse = (events) => new Response(events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join(""),
  { status: 200, headers: { "content-type": "text/event-stream", "request-id": "req_mock" } });
const start = (id) => ({ type: "message_start", message: { id, type: "message", role: "assistant", model: "claude-opus-5-5",
  content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 120, output_tokens: 0 } } });

function mockFetch(log) {
  let call = 0;
  return async (url, init) => {
    const body = JSON.parse(init.body);
    log.push(body);
    call++;
    if (call === 1) return sse([
      start("msg_1"),
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Let me read the thresholds. " } },
      { type: "content_block_stop", index: 0 },
      { type: "content_block_start", index: 1, content_block: { type: "tool_use", id: "toolu_1", name: "read_file", input: {} } },
      { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: '{"path":"src/scoring/' } },
      { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: 'thresholds.js"}' } },
      { type: "content_block_stop", index: 1 },
      { type: "content_block_start", index: 2, content_block: { type: "tool_use", id: "toolu_2", name: "read_file", input: {} } },
      { type: "content_block_delta", index: 2, delta: { type: "input_json_delta", partial_json: '{"path":"netlify/lib/auth.ts"}' } },
      { type: "content_block_stop", index: 2 },
      { type: "message_delta", delta: { stop_reason: "tool_use", stop_sequence: null }, usage: { output_tokens: 40 } },
      { type: "message_stop" },
    ]);
    return sse([
      start("msg_2"),
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "The 1 in/h rate threshold " } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "matches NWS guidance." } },
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 12 } },
      { type: "message_stop" },
    ]);
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const log = [];
  const client = new Anthropic({ apiKey: "test-key-not-real", fetch: mockFetch(log), maxRetries: 0 });
  const events = [];
  const messages = [{ role: "user", content: "Is the rain-rate threshold right?" }];
  const r = await runTurn({ client, model: "claude-opus-5-5", system: "You are weather-risk-scientist.", messages,
    send: (e) => events.push(e), deadline: Date.now() + 45_000,
    tools: { readFile: async (p) => `// ${p}\nexport const RATE = 1;`, propose: async () => "proposal p_1 stored" } });

  console.log(events.map((e) => (e.type === "text" ? e.text : `[${e.type}]`)).join(""));
  assert.equal(r.stop, "end_turn");
  assert.deepEqual(r.usage, { input_tokens: 240, output_tokens: 52 });
  assert.equal(log.length, 2);
  assert.equal(log[0].stream, true);
  assert.equal(log[0].tool_choice.type, "auto");                     // forced tool_choice 400s on Opus 5.5
  const toolMsg = log[1].messages.at(-1);                             // what we sent back
  assert.equal(toolMsg.role, "user");
  assert.equal(toolMsg.content.length, 2);                            // both results in one message
  assert.equal(toolMsg.content[0].is_error, undefined);
  assert.equal(toolMsg.content[1].is_error, true);                    // netlify/lib/auth.ts is not readable
  assert.match(toolMsg.content[1].content, /Path not allowed/);
  assert.ok(events.at(-1).type === "done");
  console.log("02-chat-sse-tool-loop: all checks passed");
}
