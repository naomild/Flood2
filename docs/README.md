# Flood2 research docs

Research for a mobile-friendly, installable web app (PWA) on Netlify: pick a South
Florida city and see the **flood outlook**, the **chance of a power outage**, and a
**beach-day score** for today and the next few days, using the free Open-Meteo forecast
and marine APIs (no API key). The deployed app also has an **Agent Console** for chatting
with the project's Claude agents and approving the code changes they propose.

These docs are the shared context for the team of expert agents that will build the app.
Researched 2026-11-26.

| # | Doc | Covers |
|---|---|---|
| 01 | [Use case, data and scoring](01-use-case-and-scoring.md) | The user's problem, Open-Meteo forecast + marine fields, city list, flood / power-outage / beach-day scoring with sources |
| 02 | [PWA installability](02-pwa-installability.md) | Manifest, service worker, iPhone vs Android install, offline, when to use Capacitor instead |
| 03 | [Architecture](03-architecture.md) | Static Netlify site + Netlify Functions, limits, Blobs, env vars, repo layout, `netlify.toml` |
| 04 | [Agent Console](04-agent-console.md) | Listing `.claude/agents`, chat via a function, propose → Approve → GitHub commit → redeploy, security, long jobs |
| 05 | [Testing and accessibility](05-testing-and-accessibility.md) | Unit / function / e2e tests, PWA checks, WCAG 2.2 AA checklist |
| — | [Decisions](decisions.md) | The owner's fixed decisions (D1–D6) and their consequences |
| — | [Agent brains](agent-brains.md) | Each agent's model, first name, personality and knowledge folder |
| — | [Expert roster](expert-roster.md) | The 12 expert agents, their jobs, shared skills and sign-off rules |

## Key decisions at a glance

- **Weather calls go straight from the browser to Open-Meteo**; no server needed for the
  public app. Service worker keeps the last forecast for offline use during outages.
- **Scores are heuristics**, clearly labelled as estimates with their reasons, alongside
  links to the NWS and the power company's outage map. Thresholds live in one tunable
  object.
- **Secrets are read only by Netlify Functions** (`ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, …) via
  `process.env`; on the Free plan they can't be scope-restricted, so the build never touches them.
- **Agents can only propose**; a human clicks Approve, which commits one file through the
  GitHub contents API using a fine-grained token limited to this repository. A path
  allow-list blocks edits to functions, config, workflows and package files.
- **Netlify limits:** 60 s for normal/streaming functions → chat; 15 min background
  functions + Blobs progress + polling → long agent jobs.
- **Default model** `claude-opus-5-5`; agents can name `sonnet` or `haiku` aliases.

## Agent team

See [expert-roster.md](expert-roster.md): 12 expert agents, their jobs, shared skills and sign-off rules.

## Not verified in this pass (read the docs before building)

- NWS API (`api.weather.gov`) alerts, NOAA CO-OPS tide predictions, and the NWS Key West
  surf-zone page (the NWS Miami links for D2 are verified)
- Whether Netlify's "Contains secret values" flag is available on the Free plan
- GitHub Git Data API for atomic multi-file commits
- Open-Meteo licence/attribution wording (CC BY 4.0 expected)
