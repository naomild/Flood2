# Flood — project guide for Claude

Flood is a mobile-first, installable web app (PWA) for South Florida: pick a city and see
the **flood outlook**, the **chance of a power outage** and a **beach-day score** for
today and the next few days, from the free Open-Meteo forecast and marine APIs. The
deployed app also has an **Agent Console** (`/agents`) where the owner chats with this
team's agents and approves code changes they propose.

## Fixed decisions (`docs/decisions.md`)

- **D1** Static front end + Netlify Functions (Claude and GitHub calls only). No other servers.
- **D2** No rip-current estimate; link to the National Weather Service.
- **D3** Approve in the Agent Console commits straight to `main` (= production deploy).
- **D4** Netlify Free plan (background functions OK; only 2 rate-limit rules).
- **D5** GitHub writes use a fine-grained personal access token, this repo only, Contents only.

Research and specs: `docs/README.md` (index), `docs/01`–`05`, `docs/expert-roster.md`.

## The team

Twelve expert subagents live in `.claude/agents/`. Roles, skills and sign-off rules:
`docs/expert-roster.md`.

| Agent | Role |
|---|---|
| `orchestrator` | Runs the team: plans, runs experts in parallel, routes every hand-off, commits and pushes |
| `agent-builder` | Meta agent: builds and improves the agents and skills |
| `software-architect` | Overall design inside D1, architecture decisions |
| `open-meteo-integrator` | Open-Meteo requests, city list, parsing, fixtures |
| `weather-risk-scientist` | Flood / outage / beach scoring and risk wording |
| `pwa-mobile-engineer` | Front end, manifest, service worker, offline, install |
| `ui-designer-apple-liquid-glass` (**Sable**) | Visual design in Apple's Liquid Glass style |
| `ux-designer-apple-hig` (**Wren**) | Flows, layout and copy to Apple's HIG |
| `agent-console-engineer` | Agent Console: Claude API chat/jobs, propose → Approve → GitHub commit |
| `security-engineer` | Auth, secrets, token scope, allow-list, CSP, rate limits — required sign-off |
| `netlify-engineer` | `netlify.toml`, functions config, Blobs, env vars, deploys |
| `qa-engineer` | Tests, accessibility and PWA audits, release go/no-go |

Each agent preloads its skills from `.claude/skills/` through the `skills:` field. The 23
skills are reference knowledge (`user-invocable: false`), so they don't appear in the
`/` menu.

## How the team works

- **Start team work with the orchestrator.** Run `claude --agent orchestrator` to make it
  the main session, or ask: "Use the orchestrator subagent to …". Don't send multi-step
  work straight to a specialist.
- **The orchestrator runs experts in parallel.** It starts every task whose inputs are
  ready at the same time (several Agent calls in one message). Parallel tasks that write
  get separate files. Research and reviews always run in parallel.
- **Agents hand work to each other through the orchestrator.** Specialists have no
  `Agent` tool and never call each other. Each returns a report (Summary, Files changed,
  Decisions/assumptions, Needs review by, Open questions, Verification). The
  orchestrator routes reviews and questions to the right expert, or to the owner.
- **Sign-offs:** security-engineer for secrets, auth, the allow-list, headers and GitHub
  writes. Wren and Sable for any user-facing screen. weather-risk-scientist for scoring
  thresholds. qa-engineer before release.
- **Only the orchestrator commits and pushes**, after sign-offs and green tests.
- **Only agent-builder edits `.claude/agents/` and `.claude/skills/`.** It keeps
  `docs/expert-roster.md` and this file in sync. The deployed Agent Console reads the
  agent files, so they must never contain secrets.

## Working rules for everyone

- Read the official docs before building and cite them; mark anything unverified
  (`official-docs-research` skill).
- Secrets live only in Netlify Function environment variables. Never put them in
  `public/`, responses, logs or commits.
- Tests never call real Claude, GitHub or Netlify APIs.
- Scores are estimates: always show the reasons and the data time, and link to the NWS.
