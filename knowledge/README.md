# Agent knowledge

Each agent in `.claude/agents/` has its own folder here: `knowledge/<agent-name>/`. Every agent
file tells the agent to **read every file in its folder before answering and prefer it over memory**.

- `docs/` — reference notes taken from official documentation, each with its source link and the
  date it was read. Quotes are marked; anything that is our interpretation says so.
- `examples/` — small, correct worked examples of what good looks like. Code examples are runnable
  and were run on 2026-11-26.

| Agent | Sources |
|---|---|
| [orchestrator](orchestrator/) | Claude Code docs (sub-agents) |
| [agent-builder](agent-builder/) | Claude Code docs (sub-agents, skills) |
| [software-architect](software-architect/) | Nygard ADRs; Netlify, Open-Meteo, MDN, GitHub limits |
| [open-meteo-integrator](open-meteo-integrator/) | open-meteo.com (forecast + marine) and real recorded responses |
| [weather-risk-scientist](weather-risk-scientist/) | National Weather Service, City of Miami, Miami-Dade County |
| [pwa-mobile-engineer](pwa-mobile-engineer/) | MDN, web.dev, WebKit |
| [ui-designer-apple-liquid-glass](ui-designer-apple-liquid-glass/) (Sable) | Apple Human Interface Guidelines |
| [ux-designer-apple-hig](ux-designer-apple-hig/) (Wren) | Apple Human Interface Guidelines |
| [agent-console-engineer](agent-console-engineer/) | Claude API docs; GitHub REST API |
| [security-engineer](security-engineer/) | OWASP Cheat Sheet Series; GitHub fine-grained token docs |
| [netlify-engineer](netlify-engineer/) | Netlify docs |
| [qa-engineer](qa-engineer/) | Playwright docs (+ Vitest) |

## Run every example

```bash
cd knowledge && npm install && npm run verify
```

`package.json` here only serves the examples (not the app). It pins `@playwright/test` to the
version of the preinstalled Chromium; don't run `playwright install`.

## Keeping it current

- Any expert who learns something from an official source adds a sourced note to **its own**
  `docs/` and says so in its report. The **agent-builder** reviews knowledge changes and keeps these
  READMEs and the folder list in step with `.claude/agents/`.
- When a note and a newer official page disagree, the official page wins: fix the note, keep the
  link and update the "read" date.
- Changes made in this pass that also corrected older docs: env vars are read with `process.env`
  in functions and can't be scope-restricted on the Free plan (Netlify docs); the NWS Miami
  rip-current links for D2 are verified.
