# Example 3 — Improve an agent from evidence (smallest effective change)

**Evidence (from the orchestrator):** two reports from `pwa-mobile-engineer` used `innerHTML` with
API data, and one cached `/api/agents` in the service worker.

## Diagnose: knowledge, role, or tools?
| Symptom | Cause | Fix type |
|---|---|---|
| `innerHTML` with data | knowledge exists (`vanilla-web-frontend` says "No `innerHTML`…") but not applied | prompt: make it a hard rule in the agent body |
| cached `/api/*` | rule only in `pwa-platform` skill, buried | skill: move it to the top of the SW section; add a test in its knowledge examples |
| — | tools fine | none |

## Change (one commit, roster unchanged)
- `.claude/agents/pwa-mobile-engineer.md`: add under Responsibilities —
  "Never use `innerHTML`/`outerHTML` with data from APIs or agents; use `textContent`."
- `.claude/skills/pwa-platform/SKILL.md`: first line of the Service worker section —
  "`/api/*`: network only, never cached."
- Validate: `claude plugin validate .claude/agents` and `.claude/skills` → pass.
- Report to orchestrator: what changed, why, how to tell if it worked (next two reports clean).

Don't: rewrite the whole prompt, add tools "just in case", or change the model without evidence.
