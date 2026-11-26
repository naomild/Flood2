---
name: architecture-decisions
description: "Flood's architecture, its boundaries and how to record decisions. Use when designing a module, choosing where code or state lives, or proposing a structural change."
user-invocable: false
---
# Architecture and decisions

Fixed by `docs/decisions.md` (D1): **static front end + Netlify Functions, no other servers.**
Amended by D6: Supabase Auth with Google is the one allowed outside service, for owner login to
the Agent Console only; no app data in Supabase. Rules: `docs/security/agent-console-auth.md`.

## Boundaries
- `public/` — static app (HTML, CSS, ES modules, `sw.js`, manifest, icons, `data/cities.json`).
- `src/scoring/` — pure scoring functions; no network, no DOM.
- `netlify/functions/` — the only server code; only place secrets are read.
- `netlify/lib/` — shared function code (auth, allow-list, GitHub, agents, Blobs).
- State: browser (Cache Storage, IndexedDB) or Netlify Blobs. Nothing else (Supabase holds only the Auth user record, D6).
- Browser → Open-Meteo directly; browser → `/api/*` for anything with a secret.

Detail: `docs/03-architecture.md`, `docs/04-agent-console.md`.

## Recording a decision
Owner decisions go in `docs/decisions.md` (ID, date, decision, consequences). Technical
decisions inside those limits go in the owning doc under a "Decision" note: context,
options considered, choice, consequences. Never contradict a D-decision; if one blocks the
work, report it to the orchestrator as an open question for the owner.

## Review checklist
Fits D1 (and D6)? Secrets only in functions? Data flow obvious? Fewer moving parts than the
alternative? Works offline where the user needs it? Testable without the network?
