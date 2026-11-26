# Example 1 — Plan a feature and brief experts in parallel

**Owner's goal:** "Show the power-outage chance on the home screen."

## Plan (dependencies → what can run at once)
| # | Task | Owner | Reviewers | Needs |
|---|---|---|---|---|
| 1 | Outage scoring rules + THRESHOLDS + tests | weather-risk-scientist | qa-engineer | — |
| 2 | Card flow, states and copy | ux-designer-apple-hig (Wren) | weather-risk-scientist (wording) | — |
| 3 | Badge/card visuals and tokens | ui-designer-apple-liquid-glass (Sable) | Wren | — |
| 4 | Build the card in `public/` | pwa-mobile-engineer | Sable, Wren, qa-engineer | 1, 2, 3 |
| 5 | E2E + axe tests | qa-engineer | — | 4 |

**Round 1 (parallel, disjoint files):** 1 (`src/scoring/outage.js`, `tests/outage.test.js`),
2 (`docs/ux/outage-card.md`), 3 (`public/styles/tokens.css`). → three Agent calls in one message.
**Round 2:** 4, after 1–3 report back. **Round 3:** reviews in parallel (Sable, Wren, QA), then 5.

## A brief (self-contained — the expert doesn't see this conversation)
> **To weather-risk-scientist.** Goal: implement `scoreOutage(day, ctx)` in `src/scoring/outage.js`
> returning `{value, band, reasons}` per `knowledge/software-architect/examples/day-model-contract.md`.
> Files in scope: `src/scoring/outage.js`, `tests/outage.test.js`. Rules: `docs/01-use-case-and-scoring.md`
> §4.2, decisions D1–D5, skills `risk-scoring-code` and `flood-risk-science`. Done when: thresholds
> in one frozen object, every band has a reason, table-driven tests pass with `npx vitest run`.
> Next reviewer: qa-engineer. Report in the team format.
