# Claude models (current)

Source: Claude API docs, *Models overview* — <https://platform.claude.com/docs/en/about-claude/models/overview.md> (read 2026-11-26)

| | Claude Opus 5.5 | Claude Sonnet 5.5 | Claude Haiku 5.5 | Claude Fable 5.2 |
|---|---|---|---|---|
| API ID / alias | `claude-opus-5-5` | `claude-sonnet-5-5` | `claude-haiku-5-5` | `claude-fable-5-2` |
| Described as | "For long-running agentic coding and knowledge work" | "The best combination of speed and intelligence" | "For high-volume, latency-sensitive tasks such as classification, extraction, and routing" | "For demanding reasoning and long-horizon agentic work" |
| Price (input / output per MTok) | $4 / $20 | $2 / $10 | from $0.10 / from $0.50 | $8 / $40 |
| Latency | Moderate | Fast | Fastest | Moderate |
| Thinking | Adaptive (always on) | Adaptive | Adaptive | Adaptive (always on) |
| Default effort | `medium` | `high` | `medium` | `high` |
| Context / max output | 1M / 128K | 1M / 128K | 1M / 128K | 1M / 128K |
| Retirement | not sooner than 2027-09-22 | not sooner than 2027-09-28 | not sooner than 2027-10-07 | not sooner than 2027-11-09 |

## Flood mapping (agent front matter `model:` → API ID)
`opus` / `inherit` / missing → `claude-opus-5-5` · `sonnet` → `claude-sonnet-5-5` ·
`haiku` → `claude-haiku-5-5`. Fable is **not** on the Agent Console allow-list (cost).
Re-check this page (or `GET /v1/models`) before changing the allow-list.
