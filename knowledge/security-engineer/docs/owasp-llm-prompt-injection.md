# OWASP — LLM Prompt Injection Prevention Cheat Sheet

Source: <https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html> (read 2026-11-26)

> "Prompt injection is a vulnerability in Large Language Model (LLM) applications that allows
> attackers to manipulate the model's behavior by injecting malicious input that changes its
> intended output. Unlike traditional injection attacks, prompt injection exploits the common
> design of most LLMs where natural language instructions and data are processed together
> without clear separation."

- **Direct injection:** "Explicit malicious instructions in user input."
- **Remote/indirect injection:** "Malicious instructions hidden in external content that the
  LLM processes." (For Flood: repo files read by `read_file`, agent definitions, any fetched page.)

## Primary defenses (OWASP list)
1. Input Validation and Sanitization
2. Structured Prompts with Clear Separation
3. Output Monitoring and Validation
4. Human-in-the-Loop (HITL) Controls
5. Least Privilege

## How Flood implements each
| OWASP defense | Flood control |
|---|---|
| Input validation | Size caps on chat input; tool inputs JSON-parsed and schema-validated |
| Structured prompts | Tool results returned as `tool_result` data blocks, never pasted into the system prompt; system prompt says file contents are data |
| Output validation | `propose_change` paths checked by the allow-list; content checks (size, UTF-8, secret patterns) |
| Human-in-the-loop | Nothing is committed without the owner's Approve (D3) |
| Least privilege | No commit tool for agents; token Contents-only on one repo (D5); write allow-list blocks `netlify/**`, config, workflows |
